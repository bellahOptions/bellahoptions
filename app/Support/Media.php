<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

/**
 * Resolves a stored image value into something the front end can render well.
 *
 * A stored value can be one of three shapes, and all three must keep working:
 *
 *  1. `/media/{folder}/{name}`   — the local image engine (variants available);
 *  2. `https://res.cloudinary…`   — a Cloudinary delivery URL;
 *  3. `/images/foo.jpg`           — a legacy path straight out of `public/`.
 *
 * `Media::image()` collapses them into one payload so a component never has to
 * know which engine produced the file, and so `srcset` is emitted whenever
 * variants genuinely exist.
 */
class Media
{
    /**
     * Canonicalise any stored value to a browser-usable URL.
     *
     * Returns null for values that are not safe to render (empty strings,
     * `javascript:` URLs, protocol-relative paths).
     */
    public static function url(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $candidate = trim($value);

        if ($candidate === '') {
            return null;
        }

        if (PublicContentSecurity::isSafeHttpUrl($candidate)) {
            return $candidate;
        }

        // Reject "//evil.example/x.jpg": protocol-relative URLs inherit the page
        // scheme and would load from a third-party origin.
        if (str_starts_with($candidate, '//')) {
            return null;
        }

        if (! str_starts_with($candidate, '/')) {
            return null;
        }

        return PublicContentSecurity::isSafeRelativePath($candidate) ? $candidate : null;
    }

    /**
     * Every width variant stored for a `/media/...` path, smallest first.
     *
     * @return array<int, array{width: int, url: string}>
     */
    public static function variants(mixed $value): array
    {
        $parsed = is_string($value) ? MediaPath::parse($value) : null;

        if ($parsed === null) {
            return [];
        }

        $disk = Storage::disk(ImageEngine::DISK);
        $variants = [];

        foreach (MediaPath::VARIANT_WIDTHS as $width) {
            $name = MediaPath::variantName($parsed['name'], $width);

            if ($name === null) {
                continue;
            }

            $storagePath = MediaPath::storagePath($parsed['folder'], $name);

            if (! $disk->exists($storagePath)) {
                continue;
            }

            $variants[] = [
                'width' => $width,
                'url' => MediaPath::url($parsed['folder'], $name),
            ];
        }

        return $variants;    }

    /**
     * The full render payload for a stored image.
     *
     * @return array{
     *   src: string|null,
     *   srcset: string,
     *   variants: array<int, array{width: int, url: string}>,
     *   is_local: bool
     * }|null
     */
    public static function image(mixed $value): ?array
    {
        $url = self::url($value);

        if ($url === null) {
            return null;
        }

        $variants = is_string($value) ? self::variants($value) : [];
        $srcsetParts = array_map(
            static fn (array $variant): string => $variant['url'].' '.$variant['width'].'w',
            $variants,
        );

        // The full-size image is the last candidate so a wide viewport can still
        // request it when no larger variant exists.
        $srcsetParts[] = $url.' 2560w';

        return [
            'src' => $url,
            'srcset' => implode(', ', $srcsetParts),
            'variants' => $variants,
            'is_local' => MediaPath::isMediaPath($value),
        ];
    }

    /**
     * Absolute URL for a stored image, for emails, sitemaps and Open Graph tags
     * where a relative path is not acceptable.
     */
    public static function absoluteUrl(mixed $value): ?string
    {
        $url = self::url($value);

        if ($url === null) {
            return null;
        }

        if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://')) {
            return $url;
        }

        return URL::to($url);
    }
}
