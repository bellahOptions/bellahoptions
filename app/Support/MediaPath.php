<?php

namespace App\Support;

/**
 * Canonical storage path helpers for the local image engine.
 *
 * Stored values are always a site-relative path of the form
 * `/media/{folder}/{name}` where `name` is `<sha1>[-<width>][@2x].<ext>`.
 *
 * Nothing else is accepted. The filename charset is deliberately tiny (hex
 * digest, digits, one letter suffix) so a stored value can never escape the
 * media directory, and a request for a variant can be validated by shape
 * instead of by resolving the path on disk.
 */
class MediaPath
{
    public const PREFIX = 'media';

    public const URL_PREFIX = '/media';

    /**
     * Digits only, so `/media/x/123.jpg` cannot be mistaken for a variant.
     */
    public const VARIANT_WIDTHS = [320, 480, 640, 960, 1280, 1600, 2000];

    private const SAFE_FOLDER = '/^[a-z0-9][a-z0-9-]*$/';

    private const SAFE_FILE = '/^[a-f0-9]{40}(?:-(?:[0-9]{3,4})|-(?:[0-9]{3,4})@2x)?\.(?:jpe?g|png|webp|avif|gif)$/';

    /**
     * The path of a stored file *within the media disk*.
     *
     * The disk root is already `storage/app/media`, so this must not repeat the
     * `media/` segment — doing so wrote files to `storage/app/media/media/...`
     * and made every variant lookup miss.
     */
    public static function storagePath(string $folder, string $name): string
    {
        return $folder.'/'.$name;
    }

    /**
     * The browser-facing URL for a stored file.
     */
    public static function url(string $folder, string $name): string
    {
        return self::URL_PREFIX.'/'.$folder.'/'.$name;
    }

    /**
     * Validate a folder name before it is used to build a path.
     */
    public static function isValidFolder(string $folder): bool
    {
        return preg_match(self::SAFE_FOLDER, $folder) === 1;
    }

    /**
     * Validate a stored file name (`<sha1>[-<width>][@2x].<ext>`).
     */
    public static function isValidFileName(string $name): bool
    {
        return preg_match(self::SAFE_FILE, $name) === 1;
    }

    /**
     * Parse a stored `/media/{folder}/{file}` path into its parts.
     *
     * @return array{folder: string, name: string}|null
     */
    public static function parse(string $path): ?array
    {
        $candidate = trim($path);

        if ($candidate === '' || ! str_starts_with($candidate, self::URL_PREFIX.'/')) {
            return null;
        }

        $rest = substr($candidate, strlen(self::URL_PREFIX) + 1);
        $segments = explode('/', $rest);

        if (count($segments) !== 2) {
            return null;
        }

        [$folder, $name] = $segments;

        if (! self::isValidFolder($folder) || ! self::isValidFileName($name)) {
            return null;
        }

        return ['folder' => $folder, 'name' => $name];
    }

    /**
     * Whether a stored value is a local media path.
     */
    public static function isMediaPath(mixed $path): bool
    {
        return is_string($path) && self::parse($path) !== null;
    }

    /**
     * Derive the variant file name for a stored original name.
     *
     * `abc…f.webp` + 640          -> `abc…f-640.webp`
     * `abc…f.webp` + 640, retina  -> `abc…f-640@2x.webp`
     * Returns null when the name is not a valid original or already a variant.
     */
    public static function variantName(string $originalName, int $width, bool $retina = false): ?string
    {
        if (! self::isValidFileName($originalName)) {
            return null;
        }

        if (preg_match('/-[0-9]{3,4}(?:@2x)?\./', $originalName) === 1) {
            return null;
        }

        if (! in_array($width, self::VARIANT_WIDTHS, true)) {
            return null;
        }

        $dot = strrpos($originalName, '.');

        if ($dot === false) {
            return null;
        }

        $stem = substr($originalName, 0, $dot);
        $extension = substr($originalName, $dot);

        return $stem.'-'.$width.($retina ? '@2x' : '').$extension;
    }
}
