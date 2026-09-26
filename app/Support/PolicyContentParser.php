<?php

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMNode;

class PolicyContentParser
{
    /**
     * Parse admin-edited policy content (JSON sections, rich HTML, or plain text)
     * into a normalized list of sections. Returns an empty array when the content
     * is blank or does not yield any usable section, so callers can fall back to
     * a static page.
     *
     * @return array<int, array{id:string, title:string, body:array<int,string>, bullets:array<int,string>}>
     */
    public static function resolveSections(?string $termContent): array
    {
        $content = trim((string) $termContent);

        if ($content === '') {
            return [];
        }

        $decoded = json_decode($content, true);

        if (json_last_error() === JSON_ERROR_NONE) {
            if (is_array($decoded) && array_is_list($decoded)) {
                return self::normalizeSections($decoded);
            }

            if (is_array($decoded) && isset($decoded['sections']) && is_array($decoded['sections'])) {
                return self::normalizeSections($decoded['sections']);
            }

            return self::parsePlainText($content);
        }

        if (str_contains($content, '<') && str_contains($content, '>')) {
            return self::parseHtmlContent($content);
        }

        return self::parsePlainText($content);
    }

    /**
     * @param  array<int, mixed>  $rawSections
     * @return array<int, array{id:string, title:string, body:array<int,string>, bullets:array<int,string>}>
     */
    private static function normalizeSections(array $rawSections): array
    {
        $sections = [];

        foreach (array_values($rawSections) as $index => $section) {
            $sections[] = self::normalizeSection(is_array($section) ? $section : [], $index);
        }

        return array_values(array_filter(
            $sections,
            static fn (array $section): bool => $section['title'] !== '' || $section['body'] !== [] || $section['bullets'] !== []
        ));
    }

    /**
     * @param  array<string, mixed>  $section
     * @return array{id:string, title:string, body:array<int,string>, bullets:array<int,string>}
     */
    private static function normalizeSection(array $section, int $index): array
    {
        $title = trim((string) ($section['title'] ?? ''));
        $title = $title !== '' ? $title : 'Section '.($index + 1);

        $id = trim((string) ($section['id'] ?? ''));
        $id = $id !== '' ? $id : (self::slugify($title) ?: 'section-'.($index + 1));

        $body = array_values(array_filter(array_map(
            static fn ($item): string => trim((string) $item),
            is_array($section['body'] ?? null) ? $section['body'] : []
        )));

        $bullets = array_values(array_filter(array_map(
            static fn ($item): string => trim((string) $item),
            is_array($section['bullets'] ?? null) ? $section['bullets'] : []
        )));

        return ['id' => $id, 'title' => $title, 'body' => $body, 'bullets' => $bullets];
    }

    private static function slugify(string $value): string
    {
        $value = strtolower($value);
        $value = (string) preg_replace('/[^a-z0-9]+/', '-', $value);
        $value = trim($value, '-');

        return $value !== '' ? $value : 'section';
    }

    /**
     * Parse plain text into sections.
     *
     * Legal copy pasted from a document numbers its headings ("1. Introduction",
     * "Section 4: Payment"). Treating the whole thing as one blob threw that
     * structure away, so the page lost its contents list and the wording arrived
     * under a generic "Policy Content" heading. Heading lines are therefore
     * promoted to sections; anything else keeps the previous paragraph handling.
     *
     * @return array<int, array{id:string, title:string, body:array<int,string>, bullets:array<int,string>}>
     */
    private static function parsePlainText(string $content): array
    {
        $normalized = (string) preg_replace('/<[^>]+>/', ' ', $content);
        $lines = preg_split('/\R/', $normalized) ?: [];

        // A heading line is: optional numbering ("1.", "1.2", "Section 3:", "#")
        // followed by a title, on its own line, with no trailing sentence period.
        $headingPattern = '/^\s*(?:#{1,6}\s+|(?:section\s+)?\d+(?:\.\d+)*[.):]?\s+)(.{2,120})$/i';
        $numberedOnly = '/^\s*\d+(?:\.\d+)*[.):]?\s*$/';

        $sections = [];
        $current = null;

        $flush = static function () use (&$sections, &$current): void {
            if ($current === null) {
                return;
            }

            $hasContent = $current['body'] !== [] || $current['bullets'] !== [];

            if ($current['title'] !== '' || $hasContent) {
                $sections[] = $current;
            }

            $current = null;
        };

        foreach ($lines as $line) {
            $trimmed = trim($line);

            if ($trimmed === '') {
                continue;
            }

            // A bare number is a heading whose title wrapped onto the next line.
            if (preg_match($numberedOnly, $trimmed) === 1) {
                continue;
            }

            if (preg_match($headingPattern, $trimmed, $matches) === 1) {
                $title = trim($matches[1]);

                // A heading is short and not a full sentence.
                $looksLikeHeading = mb_strlen($title) <= 120 && ! preg_match('/[.!?]\s+\S/', $title);

                if ($looksLikeHeading) {
                    $flush();
                    $current = [
                        'id' => self::slugify($trimmed),
                        'title' => $trimmed,
                        'body' => [],
                        'bullets' => [],
                    ];

                    continue;
                }
            }

            if ($current === null) {
                $current = ['id' => 'policy-content', 'title' => '', 'body' => [], 'bullets' => []];
            }

            if (preg_match('/^\s*[-*\x{2022}]\s+(.+)$/u', $trimmed, $matches) === 1) {
                $current['bullets'][] = trim($matches[1]);

                continue;
            }

            $current['body'][] = $trimmed;
        }

        $flush();

        if ($sections === []) {
            return [];
        }

        return self::normalizeSections($sections);
    }

    /**
     * @return array<int, array{id:string, title:string, body:array<int,string>, bullets:array<int,string>}>
     */
    private static function parseHtmlContent(string $content): array
    {
        $dom = new DOMDocument();
        $previousState = libxml_use_internal_errors(true);
        $dom->loadHTML('<?xml encoding="utf-8" ?><div>'.$content.'</div>', LIBXML_NOERROR | LIBXML_NOWARNING);
        libxml_use_internal_errors($previousState);

        $container = $dom->getElementsByTagName('div')->item(0);
        $nodes = [];

        if ($container instanceof DOMNode) {
            foreach ($container->childNodes as $node) {
                if ($node instanceof DOMElement) {
                    $nodes[] = $node;
                }
            }
        }

        if ($nodes === []) {
            return self::parsePlainText($content);
        }

        $sections = [];
        $current = ['id' => 'policy-content', 'title' => 'Policy Content', 'body' => [], 'bullets' => []];
        $sectionIndex = 0;

        $pushCurrent = function () use (&$sections, &$current): void {
            if ($current['title'] !== '' || $current['body'] !== [] || $current['bullets'] !== []) {
                $sections[] = $current;
            }
        };

        foreach ($nodes as $node) {
            $tag = strtolower($node->tagName);
            $text = trim((string) preg_replace('/\s+/', ' ', $node->textContent ?? ''));

            if (preg_match('/^h[1-6]$/', $tag) === 1) {
                if ($current['body'] !== [] || $current['bullets'] !== []) {
                    $pushCurrent();
                    $sectionIndex++;
                }

                $heading = $text !== '' ? $text : 'Section '.($sectionIndex + 1);
                $current = ['id' => self::slugify($heading), 'title' => $heading, 'body' => [], 'bullets' => []];

                continue;
            }

            if ($tag === 'ul' || $tag === 'ol') {
                foreach ($node->childNodes as $child) {
                    if ($child instanceof DOMElement && strtolower($child->tagName) === 'li') {
                        $itemText = trim((string) preg_replace('/\s+/', ' ', $child->textContent ?? ''));

                        if ($itemText !== '') {
                            $current['bullets'][] = $itemText;
                        }
                    }
                }

                continue;
            }

            if ($tag === 'li') {
                if ($text !== '') {
                    $current['bullets'][] = $text;
                }

                continue;
            }

            if ($text !== '') {
                $current['body'][] = $text;
            }
        }

        $pushCurrent();

        return self::normalizeSections($sections);
    }
}
