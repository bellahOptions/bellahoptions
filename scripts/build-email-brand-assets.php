<?php

/**
 * Builds the raster brand marks used by the transactional email layout.
 *
 * Why this exists: every email referenced `logo-06.svg`. Gmail, Outlook and most
 * desktop clients strip or refuse SVG in mail, so the header rendered as a broken
 * image in the majority of inboxes.
 *
 * It also replaces the previous flexbox centering (`display:flex` inside an
 * `<img>`), which Outlook ignores entirely — the logo collapsed to the left edge.
 *
 * Produces:
 *   public/images/email/logo-mark.png      96x96   (2x of 48px display)
 *   public/images/email/logo-mark-3x.png   144x144 (3x for high-density screens)
 *
 * The source is the existing square brand mark (`public/icon.jpg`), cropped to
 * the glyph and re-encoded as PNG so there is no JPEG ringing around the edges.
 * The wordmark is rendered as text in the email itself, which keeps the lockup
 * crisp at any zoom and survives images being blocked.
 */
$source = __DIR__.'/../public/icon.jpg';

if (! is_file($source)) {
    fwrite(STDERR, "Source brand mark not found: {$source}\n");
    exit(1);
}

$destination = __DIR__.'/../public/images/email';

if (! is_dir($destination) && ! mkdir($destination, 0o755, true) && ! is_dir($destination)) {
    fwrite(STDERR, "Could not create {$destination}\n");
    exit(1);
}

$image = imagecreatefromjpeg($source);

if ($image === false) {
    fwrite(STDERR, "Could not read {$source}\n");
    exit(1);
}

$width = imagesx($image);
$height = imagesy($image);

/*
 * Crop to the glyph so the mark fills its tile rather than sitting in a wide
 * margin. The source is a centred mark on a flat ground, so a centred inset works
 * without needing edge detection.
 */
$inset = (int) round($width * 0.14);
$cropSize = $width - ($inset * 2);

foreach ([2 => 96, 3 => 144] as $scale => $size) {
    $target = imagecreatetruecolor($size, $size);

    if ($target === false) {
        fwrite(STDERR, "Could not allocate {$size}px canvas\n");
        exit(1);
    }

    imagealphablending($target, false);
    imagesavealpha($target, true);
    imagefill($target, 0, 0, imagecolorallocatealpha($target, 0, 0, 0, 127));
    imagealphablending($target, true);

    imagecopyresampled(
        $target,
        $image,
        0,
        0,
        $inset,
        $inset,
        $size,
        $size,
        $cropSize,
        $cropSize,
    );

    $file = $destination.'/logo-mark'.($scale === 2 ? '' : '-3x').'.png';

    if (! imagepng($target, $file, 9)) {
        fwrite(STDERR, "Could not write {$file}\n");
        exit(1);
    }

    imagedestroy($target);

    printf("%s (%dx%d, %s bytes)%s", $file, $size, $size, number_format((int) filesize($file)), PHP_EOL);
}

imagedestroy($image);

echo "Email brand marks built.".PHP_EOL;
