<?php

/**
 * Replaces the legacy inline `logo-06.svg` header in every email template with
 * the shared rasterised brand partial.
 *
 * The old markup had two defects: Gmail and Outlook refuse SVG in mail, and the
 * `display:flex; justify-content:center` centering is ignored by Outlook's Word
 * renderer, so the logo collapsed to the left edge.
 *
 * Run once:  php scripts/replace-email-logo.php
 * Dry run:   php scripts/replace-email-logo.php --dry-run
 */
$dryRun = in_array('--dry-run', $argv, true);
$directory = __DIR__.'/../resources/views/emails';

$files = glob($directory.'/*.blade.php');
$changed = 0;

foreach ($files as $file) {
    $source = file_get_contents($file);

    if (! str_contains($source, 'logo-06.svg')) {
        continue;
    }

    // Match the whole enclosing <td> ... </td> that carries the old image, or
    // just the <img> when it sits inside a larger cell.
    $patterns = [
        // <td ...><img ... logo-06.svg ...></td>
        '/([ \t]*)<td[^>]*>\s*<img src="\{\{ asset\(\'logo-06\.svg\'\) \}\}"[^>]*>\s*<\/td>/s',
        // bare <img ... logo-06.svg ...>
        '/([ \t]*)<img src="\{\{ asset\(\'logo-06\.svg\'\) \}\}"[^>]*>/s',
    ];

    $replaced = preg_replace($patterns[0], '$1@include(\'emails.partials.logo-mark\')', $source, 1, $count);

    if ($count === 0) {
        $replaced = preg_replace($patterns[1], '$1@include(\'emails.partials.logo-mark\')', $source, 1, $count);
    }

    if ($count === 0) {
        fwrite(STDERR, 'Could not rewrite: '.basename($file).PHP_EOL);

        continue;
    }

    if ($dryRun) {
        echo 'would update '.basename($file).PHP_EOL;

        continue;
    }

    file_put_contents($file, $replaced);
    echo 'updated '.basename($file).PHP_EOL;
    $changed++;
}

echo ($dryRun ? 'Dry run complete.' : "Done. {$changed} template(s) updated.").PHP_EOL;
