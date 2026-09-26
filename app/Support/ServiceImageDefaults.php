<?php

namespace App\Support;

use Throwable;

/**
 * The artwork each service landing page ships with.
 *
 * Both the admin dashboard (which now hosts the service image manager) and the
 * platform settings page need this list, so it lives here rather than as a
 * private method on one controller that the other would have to duplicate.
 *
 * The admin UI uses these as previews and as the fallback hint shown when a
 * service has no custom upload: an empty override means the public page renders
 * the image listed here.
 */
class ServiceImageDefaults
{
    /**
     * @return array<string, string> service slug => default image path
     */
    public static function all(): array
    {
        try {
            $catalog = app(ServiceOrderCatalog::class);
        } catch (Throwable) {
            return [];
        }

        $defaults = [];

        foreach (array_keys($catalog->all()) as $serviceSlug) {
            if (! is_string($serviceSlug) || $serviceSlug === '') {
                continue;
            }

            $service = $catalog->service($serviceSlug);

            if (! is_array($service)) {
                continue;
            }

            $content = ServiceLandingContent::for($serviceSlug, $service);
            $image = $content['image'] ?? null;

            if (is_string($image) && $image !== '') {
                $defaults[$serviceSlug] = $image;
            }
        }

        return $defaults;
    }
}
