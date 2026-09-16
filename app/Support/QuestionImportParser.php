<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;
use Smalot\PdfParser\Parser as PdfParser;
use Throwable;

/**
 * Parses an uploaded CSV or PDF into a questionnaire's question list, so an
 * admin can bulk-define a template instead of adding questions one by one
 * in the editor. Both formats are best-effort: the admin reviews and edits
 * the parsed result in the template editor before saving, so a rough
 * heuristic (especially for PDF, which has no structured columns) is
 * acceptable here rather than something that must be perfectly correct.
 */
class QuestionImportParser
{
    private const VALID_TYPES = ['rating', 'text', 'choice'];

    /**
     * @return array<int, array{id: string, label: string, type: string, options: array<int, string>}>
     *
     * @throws RuntimeException when no questions could be read
     */
    public function parseCsv(string $filePath): array
    {
        $handle = fopen($filePath, 'r');

        if ($handle === false) {
            throw new RuntimeException('The CSV file could not be read.');
        }

        $rows = [];

        while (($row = fgetcsv($handle)) !== false) {
            $row = array_map(static fn (mixed $value): string => trim((string) $value), $row);

            if (implode('', $row) !== '') {
                $rows[] = $row;
            }
        }

        fclose($handle);

        if ($rows === []) {
            throw new RuntimeException('The CSV file is empty.');
        }

        [$labelIndex, $typeIndex, $optionsIndex, $rows] = $this->resolveCsvColumns($rows);

        $questions = [];

        foreach ($rows as $row) {
            $label = trim((string) ($row[$labelIndex] ?? ''));

            if ($label === '') {
                continue;
            }

            $type = strtolower(trim((string) ($row[$typeIndex] ?? '')));
            $type = in_array($type, self::VALID_TYPES, true) ? $type : 'text';

            $optionsRaw = $optionsIndex !== null ? trim((string) ($row[$optionsIndex] ?? '')) : '';
            $options = $type === 'choice' ? $this->splitOptions($optionsRaw) : [];

            $questions[] = $this->makeQuestion($label, $type, $options);
        }

        if ($questions === []) {
            throw new RuntimeException('No questions could be read from this CSV. Expected a "question" column (and optionally "type" and "options").');
        }

        return $questions;
    }

    /**
     * @return array<int, array{id: string, label: string, type: string, options: array<int, string>}>
     *
     * @throws RuntimeException when no questions could be read
     */
    public function parsePdf(string $filePath): array
    {
        $this->assertRequiredExtensionsLoaded();

        try {
            $pdf = (new PdfParser())->parseFile($filePath);
            $pageTexts = array_map(fn ($page) => $page->getText(), $pdf->getPages());
        } catch (Throwable $exception) {
            Log::error('smalot/pdfparser failed to parse an uploaded questionnaire PDF.', [
                'exception_class' => get_class($exception),
                'message' => $exception->getMessage(),
            ]);

            throw new RuntimeException('The PDF could not be read. It may be password-protected, corrupted, or an unsupported format.', previous: $exception);
        }

        $lines = array_values(array_filter(
            array_map('trim', preg_split('/\r\n|\r|\n/', implode("\n", $pageTexts)) ?: []),
            static fn (string $line): bool => $line !== '',
        ));

        $questions = $this->extractQuestionsFromLines($lines);

        if ($questions === []) {
            throw new RuntimeException('No questions could be found in this PDF. Questions are detected as lines ending in "?".');
        }

        return $questions;
    }

    /**
     * Heuristically groups plain text lines into questions: a line ending in
     * "?" starts a question, and any immediately following "option-looking"
     * lines (bulleted/lettered/numbered) become its choice options — unless
     * the question text itself reads as a rating prompt (e.g. "Rate 1-5" or
     * "...to 5?"), in which case it's a rating question instead. Isolated
     * from parsePdf() so it can be unit tested with hand-crafted lines
     * without needing a real PDF file.
     *
     * @param  array<int, string>  $lines
     * @return array<int, array{id: string, label: string, type: string, options: array<int, string>}>
     */
    private function extractQuestionsFromLines(array $lines): array
    {
        $questions = [];
        $count = count($lines);
        $i = 0;

        while ($i < $count) {
            $line = $lines[$i];

            if (! str_ends_with($line, '?')) {
                $i++;

                continue;
            }

            $isRating = preg_match('/\brate\b|\d\s*(-|to)\s*\d/i', $line) === 1;

            $optionLines = [];
            $j = $i + 1;

            while ($j < $count && ! str_ends_with($lines[$j], '?') && $this->looksLikeOption($lines[$j])) {
                $optionLines[] = $this->stripOptionPrefix($lines[$j]);
                $j++;
            }

            $type = 'text';
            $options = [];

            if ($isRating) {
                $type = 'rating';
            } elseif (count($optionLines) >= 2) {
                $type = 'choice';
                $options = $optionLines;
            }

            $questions[] = $this->makeQuestion($line, $type, $options);
            $i = $j > $i ? $j : $i + 1;
        }

        return $questions;
    }

    /**
     * @param  array<int, array<int, string>>  $rows
     * @return array{0: int, 1: int, 2: ?int, 3: array<int, array<int, string>>}
     */
    private function resolveCsvColumns(array $rows): array
    {
        $header = array_map(static fn (string $value): string => strtolower(trim($value)), $rows[0]);
        $labelIndex = array_search('question', $header, true);

        if ($labelIndex === false) {
            $labelIndex = array_search('label', $header, true);
        }

        if ($labelIndex === false) {
            // No recognizable header row — assume a fixed column order and treat every row as data.
            return [0, 1, 2, $rows];
        }

        $typeIndex = array_search('type', $header, true);
        $optionsIndex = array_search('options', $header, true);

        return [
            (int) $labelIndex,
            $typeIndex === false ? 1 : (int) $typeIndex,
            $optionsIndex === false ? null : (int) $optionsIndex,
            array_slice($rows, 1),
        ];
    }

    /**
     * @return array<int, string>
     */
    private function splitOptions(string $raw): array
    {
        if ($raw === '') {
            return [];
        }

        return array_values(array_filter(array_map(
            'trim',
            preg_split('/[|;]/', $raw) ?: [],
        ), static fn (string $option): bool => $option !== ''));
    }

    private function looksLikeOption(string $line): bool
    {
        return preg_match('/^([-*•]|\(?[a-zA-Z]\)|\(?\d+\)|\d+\.)\s*/', $line) === 1;
    }

    private function stripOptionPrefix(string $line): string
    {
        return trim(preg_replace('/^([-*•]|\(?[a-zA-Z]\)|\(?\d+\)|\d+\.)\s*/', '', $line) ?? $line);
    }

    /**
     * @param  array<int, string>  $options
     * @return array{id: string, label: string, type: string, options: array<int, string>}
     */
    private function makeQuestion(string $label, string $type, array $options): array
    {
        return [
            'id' => 'q_'.Str::random(10),
            'label' => $label,
            'type' => $type,
            'options' => $options,
        ];
    }

    /**
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
                'PDF import requires the following PHP extension(s), which are not enabled on this server: '
                .implode(', ', $missing).'.'
            );
        }
    }
}
