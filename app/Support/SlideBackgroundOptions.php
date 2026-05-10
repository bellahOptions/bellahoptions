<?php

namespace App\Support;

final class SlideBackgroundOptions
{
    /**
     * @return array<int, array{id: string, label: string, description: string, download_url: string}>
     */
    public static function all(): array
    {
        return [
            [
                'id' => 'particles-ocean',
                'label' => 'Particles Ocean',
                'description' => 'Blue ocean gradient with particle network motion.',
                'download_url' => '/backgrounds/dynamic/particles-ocean.svg',
            ],
            [
                'id' => 'particles-aurora',
                'label' => 'Particles Aurora',
                'description' => 'Cool-toned aurora gradient with subtle particle links.',
                'download_url' => '/backgrounds/dynamic/particles-aurora.svg',
            ],
            [
                'id' => 'particles-cosmic',
                'label' => 'Particles Cosmic',
                'description' => 'Deep cosmic gradient with brighter floating particles.',
                'download_url' => '/backgrounds/dynamic/particles-cosmic.svg',
            ],
            [
                'id' => 'particles-sunset',
                'label' => 'Particles Sunset',
                'description' => 'Warm sunset blend with soft neon particle accents.',
                'download_url' => '/backgrounds/dynamic/particles-sunset.svg',
            ],
            [
                'id' => 'particles-nebula',
                'label' => 'Particles Nebula',
                'description' => 'Purple nebula wash with deep-space contrast.',
                'download_url' => '/backgrounds/dynamic/particles-nebula.svg',
            ],
            [
                'id' => 'particles-forest',
                'label' => 'Particles Forest',
                'description' => 'Teal and forest tones with calm motion feel.',
                'download_url' => '/backgrounds/dynamic/particles-forest.svg',
            ],
            [
                'id' => 'particles-midnight',
                'label' => 'Particles Midnight',
                'description' => 'Dark midnight blue canvas with icy highlights.',
                'download_url' => '/backgrounds/dynamic/particles-midnight.svg',
            ],
            [
                'id' => 'particles-ember',
                'label' => 'Particles Ember',
                'description' => 'Ember red/orange glow for high-energy hero slides.',
                'download_url' => '/backgrounds/dynamic/particles-ember.svg',
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
