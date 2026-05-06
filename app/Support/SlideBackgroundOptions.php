<?php

namespace App\Support;

final class SlideBackgroundOptions
{
    /**
     * @return array<int, array{id: string, label: string, description: string}>
     */
    public static function all(): array
    {
        return [
            [
                'id' => 'particles-ocean',
                'label' => 'Particles Ocean',
                'description' => 'Blue ocean gradient with particle network motion.',
            ],
            [
                'id' => 'particles-aurora',
                'label' => 'Particles Aurora',
                'description' => 'Cool-toned aurora gradient with subtle particle links.',
            ],
            [
                'id' => 'particles-cosmic',
                'label' => 'Particles Cosmic',
                'description' => 'Deep cosmic gradient with brighter floating particles.',
            ],
        ];
    }

    public static function sanitize(mixed $value): ?string
    {
        $normalized = trim((string) $value);
        if ($normalized === '') {
            return null;
        }

        return in_array($normalized, self::ids(), true) ? $normalized : null;
    }

    /**
     * @return array<int, string>
     */
    public static function ids(): array
    {
        return array_values(array_map(
            static fn (array $option): string => (string) $option['id'],
            self::all(),
        ));
    }
}
