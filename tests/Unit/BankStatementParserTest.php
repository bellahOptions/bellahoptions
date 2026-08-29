<?php

namespace Tests\Unit;

use App\Support\BankStatementParser;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

/**
 * Exercises BankStatementParser's line-parsing algorithm directly via
 * reflection, using hand-crafted line arrays that mirror the exact patterns
 * observed in a real Fidelity Bank (Nigeria) statement extracted through
 * smalot/pdfparser (the real statement itself is customer financial data
 * and is not committed to the repo — this was validated separately,
 * end-to-end, against a real 59-page/1759-row statement with zero rows
 * flagged and an exact balance reconciliation).
 */
class BankStatementParserTest extends TestCase
{
    private function extractTransactions(array $lines, ?float $openingBalance): array
    {
        $parser = new BankStatementParser();
        $method = new ReflectionMethod($parser, 'extractTransactions');
        $method->setAccessible(true);

        return $method->invoke($parser, $lines, $openingBalance);
    }

    private function extractMeta(array $lines): array
    {
        $parser = new BankStatementParser();
        $method = new ReflectionMethod($parser, 'extractMeta');
        $method->setAccessible(true);

        return $method->invoke($parser, $lines);
    }

    public function test_single_line_transaction_is_parsed_and_classified_as_expense(): void
    {
        $lines = [
            '17-Jun-25 17-Jun-25 Others LEGAL SEARCH FEE IFO BELLAH OPTIONS	10,000.00 0.00',
        ];

        $transactions = $this->extractTransactions($lines, 10000.0);

        $this->assertCount(1, $transactions);
        $this->assertSame('expense', $transactions[0]['type']);
        $this->assertSame(10000.0, $transactions[0]['amount']);
        $this->assertSame(0.0, $transactions[0]['running_balance']);
        $this->assertFalse($transactions[0]['needs_review']);
        $this->assertSame('LEGAL SEARCH FEE IFO BELLAH OPTIONS', $transactions[0]['description']);
    }

    public function test_nip_transfer_continuation_lines_merge_into_description_and_strip_transfer_word(): void
    {
        $lines = [
            '16-Jun-25 16-Jun-25 NIP ',
            'Transfer',
            'AHMED OLUMUYIWA/Transfer from AHMED ',
            'OLUMUYIWA BELL',
            '10,000.00	10,000.00',
        ];

        $transactions = $this->extractTransactions($lines, 0.0);

        $this->assertCount(1, $transactions);
        $this->assertSame('NIP Transfer', $transactions[0]['channel']);
        $this->assertSame('income', $transactions[0]['type']);
        $this->assertSame(10000.0, $transactions[0]['amount']);
        $this->assertSame('AHMED OLUMUYIWA/Transfer from AHMED OLUMUYIWA BELL', $transactions[0]['description']);
        $this->assertFalse($transactions[0]['needs_review']);
    }

    public function test_glued_amount_and_balance_tokens_are_split_correctly(): void
    {
        // Real PDF-extraction artifact: no separating space when the two
        // numeric columns are close in rendered width.
        $lines = [
            '2-Oct-25 1-Oct-25 NIP ',
            'Transfer',
            'COB TRF TO CDCARE/AHM **2125 Cdcare ',
            'PAYSTACK-TITAN',
            '28,000.00303,427.84',
        ];

        $transactions = $this->extractTransactions($lines, 331427.84);

        $this->assertCount(1, $transactions);
        $this->assertSame(28000.0, $transactions[0]['amount']);
        $this->assertSame(303427.84, $transactions[0]['running_balance']);
        $this->assertSame('expense', $transactions[0]['type']);
        $this->assertFalse($transactions[0]['needs_review']);
    }

    public function test_page_boundary_header_and_footer_noise_does_not_corrupt_a_pending_continuation(): void
    {
        $lines = [
            '3-Jul-25 3-Jul-25 NIP ',
            'Transfer',
            'COB TRF TO MOTUNRAYO  **9504 Hackney ',
            'permit OPAY',
            '3,000.00 7,497.97',
            '28/08/2026',
            '2 of 59 ',
            'Transaction ',
            'Date',
            "Value Date Channel Details\tPay In Pay Out Balance",
            '4-Jul-25 4-Jul-25 Others ONB25070402030962297/',
            'RINGO/07074217206/DATA/RCH',
            '1,000.00 6,487.22',
        ];

        $transactions = $this->extractTransactions($lines, 10497.97);

        $this->assertCount(2, $transactions);
        $this->assertSame('COB TRF TO MOTUNRAYO **9504 Hackney permit OPAY', $transactions[0]['description']);
        $this->assertSame(7497.97, $transactions[0]['running_balance']);
        $this->assertSame('ONB25070402030962297/ RINGO/07074217206/DATA/RCH', $transactions[1]['description']);
        $this->assertSame(6487.22, $transactions[1]['running_balance']);
    }

    public function test_balance_delta_mismatch_flags_row_for_review(): void
    {
        $lines = [
            '17-Jun-25 17-Jun-25 Others SUSPICIOUS ROW	500.00 400.00',
        ];

        // Opening balance is 1000, row claims amount 500 but balance only
        // dropped to 400 (delta -600) — the printed amount doesn't match
        // the delta, so this must be flagged rather than silently trusted.
        $transactions = $this->extractTransactions($lines, 1000.0);

        $this->assertCount(1, $transactions);
        $this->assertTrue($transactions[0]['needs_review']);
    }

    public function test_row_with_no_amount_found_before_next_row_is_skipped_not_guessed(): void
    {
        $lines = [
            '1-Jul-25 1-Jul-25 NIP ',
            'Transfer',
            'SOME DESCRIPTION WITH NO TRAILING AMOUNT',
            '2-Jul-25 2-Jul-25 Others CLEAN ROW	100.00 900.00',
        ];

        $transactions = $this->extractTransactions($lines, 1000.0);

        $this->assertCount(1, $transactions);
        $this->assertSame('CLEAN ROW', $transactions[0]['description']);
    }

    public function test_extracts_currency_and_balances_from_meta_lines(): void
    {
        $lines = [
            'Currency: NGN',
            'Opening Balance	0.00',
            'Closing Balance	7,280.38',
        ];

        $meta = $this->extractMeta($lines);

        $this->assertSame('NGN', $meta['currency']);
        $this->assertSame(0.0, $meta['opening_balance']);
        $this->assertSame(7280.38, $meta['closing_balance']);
    }

    public function test_rejects_garbled_account_number_and_account_name(): void
    {
        // Simulates the real-world font-decode failure seen on this bank's
        // header block: transaction table text decodes fine, but the
        // dynamically-inserted account number/name are garbled by a
        // different embedded font. Garbage must not be stored as fact.
        $lines = [
            'Account: 68944A8D19',
            'Type: OBu',
            'LEHHuP25Vlh5DP',
        ];

        $meta = $this->extractMeta($lines);

        $this->assertNull($meta['account_number']);
        $this->assertNull($meta['account_name']);
    }

    public function test_accepts_well_formed_account_number_and_account_name(): void
    {
        $lines = [
            'Account: 4210082961',
            'Type: Current',
            'BELLAH OPTIONS',
        ];

        $meta = $this->extractMeta($lines);

        $this->assertSame('4210082961', $meta['account_number']);
        $this->assertSame('BELLAH OPTIONS', $meta['account_name']);
    }
}
