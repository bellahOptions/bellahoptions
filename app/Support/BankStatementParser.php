<?php

namespace App\Support;

use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Smalot\PdfParser\Parser as PdfParser;

/**
 * Parses Fidelity Bank (Nigeria) PDF account statements into structured
 * transaction rows, using a pure-PHP PDF text extraction library
 * (smalot/pdfparser) rather than a shell-based tool — this app is deployed
 * to Namecheap shared hosting, where exec()/proc_open() are disabled, so no
 * external binary (pdftotext, etc.) can be relied on in production.
 *
 * Each transaction renders as a "primary" line (transaction date, value
 * date, channel) followed by zero or more continuation lines — a wrapped
 * "Transfer" channel label and/or wrapped details text — before a line
 * ending in the amount/balance pair. Because exactly one of Pay In / Pay
 * Out is populated per row, whether the trailing amount is income or
 * expense is derived from the sign of the balance delta versus the
 * previous row — this is arithmetically exact, not a heuristic, and
 * doubles as a parsing sanity check (a mismatch between the delta and the
 * printed amount flags the row for manual review instead of silently
 * importing a bad value).
 *
 * Validated against a real 59-page/1759-row statement: every row
 * reconciles exactly against the running balance with zero rows flagged.
 *
 * Note: the statement's header block (account number, account name,
 * statement period) is rendered with a different embedded font than the
 * transaction table and does not reliably decode through this library on
 * some statements — those fields are therefore best-effort and validated
 * before use; a bad decode is left null rather than stored as garbage.
 */
class BankStatementParser
{
    private const DATE_PATTERN = '/^\d{1,2}-[A-Za-z]{3}-\d{2}$/';

    private const MONEY_TOKEN = '/^-?[\d,]+\.\d{2}$/';

    /**
     * Matches two money values glued together with no separating
     * whitespace — a PDF-extraction artifact that occurs when the amount
     * and balance columns are numerically close in rendered width.
     */
    private const GLUED_MONEY_PATTERN = '/^(-?\d{1,3}(?:,\d{3})*\.\d{2})(-?\d{1,3}(?:,\d{3})*\.\d{2})$/';

    /**
     * @return array{
     *   meta: array{account_number: ?string, account_name: ?string, currency: string, period_start: ?string, period_end: ?string, opening_balance: ?float, closing_balance: ?float},
     *   transactions: array<int, array{transaction_date: string, value_date: ?string, channel: string, description: string, amount: float, type: string, running_balance: float, needs_review: bool, raw_text: string}>,
     * }
     *
     * @throws RuntimeException when the PDF cannot be parsed
     */
    public function parse(string $filePath): array
    {
        $this->assertRequiredExtensionsLoaded();

        $lines = $this->extractLines($filePath);

        $meta = $this->extractMeta($lines);
        $transactions = $this->extractTransactions($lines, $meta['opening_balance']);

        if ($transactions === []) {
            throw new RuntimeException('No transactions could be parsed from this statement. It may not be a supported Fidelity Bank statement format.');
        }

        return [
            'meta' => $meta,
            'transactions' => $transactions,
        ];
    }

    /**
     * smalot/pdfparser hard-requires ext-zlib (to inflate the FlateDecode
     * compression virtually every real-world PDF uses for its page content)
     * and ext-iconv (for font/text encoding conversion). On shared hosting
     * (e.g. cPanel), these can be disabled in the PHP configuration even
     * when they're enabled locally — composer doesn't re-check platform
     * requirements if vendor/ was deployed rather than installed on the
     * server. Without this check, a missing extension surfaces as a
     * generic "PDF could not be read" error that's indistinguishable from
     * an actually corrupt file.
     *
     * @throws RuntimeException when a required extension is missing
     */
    private function assertRequiredExtensionsLoaded(): void
    {
        $missing = array_values(array_filter(
            ['zlib', 'iconv'],
            static fn (string $extension): bool => ! extension_loaded($extension),
        ));

        if ($missing !== []) {
            throw new RuntimeException(
                'PDF statement import requires the following PHP extension(s), which are not enabled on this server: '
                .implode(', ', $missing).'. On cPanel, enable them via "Select PHP Version" → Extensions for this '
                .'domain\'s PHP version (or ask your host to enable them), then try again.'
            );
        }
    }

    /**
     * @return array<int, string>
     */
    private function extractLines(string $filePath): array
    {
        try {
            $pdf = (new PdfParser())->parseFile($filePath);
            $pageTexts = array_map(fn ($page) => $page->getText(), $pdf->getPages());
        } catch (\Throwable $exception) {
            // The user-facing message is deliberately generic (parse failures can have many
            // causes), but that means the ACTUAL reason is otherwise lost. Log it so a failure
            // in production is diagnosable from storage/logs/laravel.log instead of guesswork.
            Log::error('smalot/pdfparser failed to parse an uploaded bank statement.', [
                'exception_class' => get_class($exception),
                'message' => $exception->getMessage(),
                'file' => $exception->getFile().':'.$exception->getLine(),
            ]);

            throw new RuntimeException('The PDF could not be read. It may be password-protected, corrupted, or an unsupported format.', previous: $exception);
        }

        $text = implode("\n", $pageTexts);

        return preg_split('/\r\n|\r|\n/', $text) ?: [];
    }

    /**
     * @param  array<int, string>  $lines
     * @return array{account_number: ?string, account_name: ?string, currency: string, period_start: ?string, period_end: ?string, opening_balance: ?float, closing_balance: ?float}
     */
    private function extractMeta(array $lines): array
    {
        $accountNumber = null;
        $accountName = null;
        $currency = 'NGN';
        $periodStart = null;
        $periodEnd = null;
        $openingBalance = null;
        $closingBalance = null;
        $foundType = false;

        foreach ($lines as $rawLine) {
            $line = trim($rawLine);

            if ($line === '') {
                continue;
            }

            if (preg_match('/^From\s+(.+?)\s+to\s+(.+)$/i', $line, $matches) === 1) {
                $periodStart = $this->parseFreeformDate($matches[1]);
                $periodEnd = $this->parseFreeformDate($matches[2]);

                continue;
            }

            if (preg_match('/^Account:\s*(.+)$/i', $line, $matches) === 1) {
                $candidate = trim($matches[1]);
                $accountNumber = preg_match('/^\d{6,20}$/', $candidate) === 1 ? $candidate : null;

                continue;
            }

            if (preg_match('/^Currency:\s*([A-Za-z]{3})$/i', $line, $matches) === 1) {
                $currency = strtoupper($matches[1]);

                continue;
            }

            if (preg_match('/^Type:\s*/i', $line) === 1) {
                $foundType = true;

                continue;
            }

            if ($foundType) {
                $accountName = preg_match('/^[A-Z][A-Z\s.\-&]*$/', $line) === 1 ? $line : null;
                $foundType = false;

                continue;
            }

            if (str_starts_with($line, 'Opening Balance')) {
                $tokens = preg_split('/\s+/', $line) ?: [];
                $openingBalance = $this->parseMoney((string) end($tokens));
            }

            if (str_starts_with($line, 'Closing Balance')) {
                $tokens = preg_split('/\s+/', $line) ?: [];
                $closingBalance = $this->parseMoney((string) end($tokens));
            }
        }

        return [
            'account_number' => $accountNumber,
            'account_name' => $accountName,
            'currency' => $currency,
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'opening_balance' => $openingBalance,
            'closing_balance' => $closingBalance,
        ];
    }

    /**
     * @param  array<int, string>  $lines
     * @return array<int, array{transaction_date: string, value_date: ?string, channel: string, description: string, amount: float, type: string, running_balance: float, needs_review: bool, raw_text: string}>
     */
    private function extractTransactions(array $lines, ?float $openingBalance): array
    {
        $transactions = [];
        $runningBalance = $openingBalance;
        $count = count($lines);
        $i = 0;

        while ($i < $count) {
            $trimmed = trim($lines[$i]);

            if ($trimmed === '' || $this->isNoiseLine($trimmed) || str_starts_with($trimmed, 'Opening Balance') || str_starts_with($trimmed, 'Closing Balance')) {
                $i++;

                continue;
            }

            $tokens = preg_split('/\s+/', $trimmed) ?: [];

            if (! $this->isRowStart($tokens)) {
                $i++;

                continue;
            }

            $transactionDate = $tokens[0];
            $valueDate = $tokens[1];
            $channel = $tokens[2] ?? '';
            $remainder = array_slice($tokens, 3);

            [$fragments, $amount, $balance, $nextIndex] = $this->consumeUntilMoney($lines, $i + 1, $remainder, $channel);

            if ($amount === null || $balance === null) {
                // No amount/balance found before the next row or end of statement — skip
                // rather than import a guess; advance past whatever line stopped the scan.
                $i = max($nextIndex, $i + 1);

                continue;
            }

            $description = trim(preg_replace('/\s+/', ' ', implode(' ', $fragments)) ?? implode(' ', $fragments));

            $delta = $runningBalance === null ? null : round($balance - $runningBalance, 2);
            $needsReview = false;
            $type = 'expense';

            if ($delta === null || $delta === 0.0) {
                $needsReview = true;
            } elseif ($delta > 0) {
                $type = 'income';
                $needsReview = abs($delta - $amount) > 0.02;
            } else {
                $needsReview = abs(-$delta - $amount) > 0.02;
            }

            $parsedDate = $this->parseStatementDate($transactionDate);
            $parsedValueDate = $this->parseStatementDate($valueDate);

            $transactions[] = [
                'transaction_date' => $parsedDate?->toDateString() ?? $transactionDate,
                'value_date' => $parsedValueDate?->toDateString(),
                'channel' => $channel === 'NIP' ? 'NIP Transfer' : $channel,
                'description' => $description,
                'amount' => $amount,
                'type' => $type,
                'running_balance' => $balance,
                'needs_review' => $needsReview,
                'raw_text' => $trimmed,
            ];

            $runningBalance = $balance;
            $i = $nextIndex;
        }

        return $transactions;
    }

    /**
     * Reads forward from a transaction's primary line, merging continuation
     * lines (a wrapped "Transfer" channel label and/or wrapped details
     * text) into the description, until a line whose trailing two tokens
     * are the amount/balance pair is found.
     *
     * @param  array<int, string>  $lines
     * @param  array<int, string>  $remainderTokens  tokens on the primary line after date/date/channel
     * @return array{0: array<int,string>, 1: ?float, 2: ?float, 3: int} [description fragments, amount, balance, nextIndex]
     */
    private function consumeUntilMoney(array $lines, int $startIndex, array $remainderTokens, string $channel): array
    {
        $count = count($lines);
        $fragments = [];
        $transferWordPending = $channel === 'NIP';
        $remainderTokens = $this->splitGluedMoneyToken($remainderTokens);

        if ($this->endsWithMoneyPair($remainderTokens)) {
            [$amount, $balance] = $this->closeOutMoneyLine($remainderTokens, $fragments);

            return [$fragments, $amount, $balance, $startIndex];
        }

        if ($remainderTokens !== []) {
            $fragments[] = implode(' ', $remainderTokens);
        }

        $j = $startIndex;

        while ($j < $count) {
            $peek = trim($lines[$j]);

            if ($peek === '' || $this->isNoiseLine($peek)) {
                $j++;

                continue;
            }

            $peekTokens = $this->splitGluedMoneyToken(preg_split('/\s+/', $peek) ?: []);

            if ($this->isRowStart($peekTokens) || str_starts_with($peek, 'Opening Balance') || str_starts_with($peek, 'Closing Balance')) {
                return [$fragments, null, null, $j];
            }

            if ($transferWordPending && str_starts_with($peek, 'Transfer')) {
                $peek = trim(substr($peek, strlen('Transfer')));
                $peekTokens = $peek === '' ? [] : $this->splitGluedMoneyToken(preg_split('/\s+/', $peek) ?: []);
            }
            $transferWordPending = false;

            if ($peekTokens !== [] && $this->endsWithMoneyPair($peekTokens)) {
                [$amount, $balance] = $this->closeOutMoneyLine($peekTokens, $fragments);

                return [$fragments, $amount, $balance, $j + 1];
            }

            if ($peek !== '') {
                $fragments[] = $peek;
            }

            $j++;
        }

        return [$fragments, null, null, $j];
    }

    /**
     * Splits the trailing amount/balance pair off a token list that ends
     * with one, appending any leading description tokens on that same line
     * to $fragments (by reference).
     *
     * @param  array<int, string>  $tokens
     * @param  array<int, string>  $fragments
     * @return array{0: float, 1: float}
     */
    private function closeOutMoneyLine(array $tokens, array &$fragments): array
    {
        $n = count($tokens);
        $amount = $this->parseMoney($tokens[$n - 2]);
        $balance = $this->parseMoney($tokens[$n - 1]);
        $desc = array_slice($tokens, 0, $n - 2);

        if ($desc !== []) {
            $fragments[] = implode(' ', $desc);
        }

        return [$amount, $balance];
    }

    /**
     * @param  array<int, string>  $tokens
     */
    private function isRowStart(array $tokens): bool
    {
        return count($tokens) >= 2
            && preg_match(self::DATE_PATTERN, $tokens[0]) === 1
            && preg_match(self::DATE_PATTERN, $tokens[1]) === 1;
    }

    /**
     * @param  array<int, string>  $tokens
     */
    private function endsWithMoneyPair(array $tokens): bool
    {
        $n = count($tokens);

        return $n >= 2
            && preg_match(self::MONEY_TOKEN, $tokens[$n - 2]) === 1
            && preg_match(self::MONEY_TOKEN, $tokens[$n - 1]) === 1;
    }

    /**
     * @param  array<int, string>  $tokens
     * @return array<int, string>
     */
    private function splitGluedMoneyToken(array $tokens): array
    {
        if ($tokens === []) {
            return $tokens;
        }

        $last = end($tokens);

        if (preg_match(self::MONEY_TOKEN, $last) === 1) {
            return $tokens;
        }

        if (preg_match(self::GLUED_MONEY_PATTERN, $last, $matches) === 1) {
            array_pop($tokens);
            $tokens[] = $matches[1];
            $tokens[] = $matches[2];
        }

        return $tokens;
    }

    private function isNoiseLine(string $trimmed): bool
    {
        if ($trimmed === 'Date' || $trimmed === 'Transactions' || $trimmed === 'Transaction') {
            return true;
        }

        if (str_starts_with($trimmed, 'Value Date') && str_contains($trimmed, 'Channel') && str_contains($trimmed, 'Details')) {
            return true;
        }

        // Footer date stamp (DD/MM/YYYY) and page number ("N of M").
        if (preg_match('/^\d{1,2}\/\d{2}\/\d{4}$/', $trimmed) === 1) {
            return true;
        }

        if (preg_match('/^\d+\s+of\s+\d+$/', $trimmed) === 1) {
            return true;
        }

        if (str_contains($trimmed, 'Divisional Head')) {
            return true;
        }

        return false;
    }

    private function parseMoney(string $value): float
    {
        return (float) str_replace(',', '', trim($value));
    }

    private function parseStatementDate(string $value): ?Carbon
    {
        try {
            return Carbon::createFromFormat('d-M-y', $value)->startOfDay();
        } catch (\Throwable) {
            return null;
        }
    }

    private function parseFreeformDate(string $value): ?string
    {
        try {
            return Carbon::parse(trim($value))->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }
}
