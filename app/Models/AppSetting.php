<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

#[Fillable(['key', 'value'])]
class AppSetting extends Model
{
    public static function getValue(string $key, ?string $default = null): ?string
    {
        $cacheKey = self::cacheKey($key);

        $cached = Cache::rememberForever($cacheKey, function () use ($key) {
            return static::query()->where('key', $key)->value('value');
        });

        return $cached ?? $default;
    }

    public static function getBool(string $key, bool $default = false): bool
    {
        $value = self::getValue($key);

        if ($value === null) {
            return $default;
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? $default;
    }

    public static function setValue(string $key, string $value): void
    {
        static::query()->updateOrCreate(
            ['key' => $key],
            ['value' => $value],
        );

        Cache::forget(self::cacheKey($key));
    }

    public static function setBool(string $key, bool $value): void
    {
        self::setValue($key, $value ? '1' : '0');
    }

    private static function cacheKey(string $key): string
    {
        return "app_setting:{$key}";
    }
}
