<?php

namespace App\Support;

final class PublicContentSecurity
{
    private const CONTROL_OR_SPACE_PATTERN = '/[\x00-\x20\x7F]/';

    public static function normalizeNullableText(mixed $value): ?string
    {
        $trimmed = trim((string) $value);

        return $trimmed !== '' ? $trimmed : null;
    }

    public static function isSafeHttpUrl(string $value): bool
    {
        if (preg_match(self::CONTROL_OR_SPACE_PATTERN, $value) === 1) {
            return false;
        }

        if (! filter_var($value, FILTER_VALIDATE_URL)) {
            return false;
        }

        $scheme = strtolower((string) parse_url($value, PHP_URL_SCHEME));

        return in_array($scheme, ['http', 'https'], true);
    }

    public static function isSafeRelativePath(string $value): bool
    {
        if (preg_match(self::CONTROL_OR_SPACE_PATTERN, $value) === 1) {
            return false;
        }

        if (! str_starts_with($value, '/')) {
            return false;
        }

        if (str_starts_with($value, '//') || str_contains($value, '..')) {
            return false;
        }

        return true;
    }

    public static function isSafeRelativePathOrHttpUrl(mixed $value): bool
    {
        if (! is_string($value)) {
            return false;
        }

        return self::isSafeRelativePath($value) || self::isSafeHttpUrl($value);
    }

    public static function sanitizeRelativePathOrHttpUrl(mixed $value): ?string
    {
        $normalized = self::normalizeNullableText($value);

        if ($normalized === null) {
            return null;
        }

        return self::isSafeRelativePathOrHttpUrl($normalized) ? $normalized : null;
    }
}
