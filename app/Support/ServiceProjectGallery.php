<?php

namespace App\Support;

use App\Models\GalleryProject;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Published gallery projects that belong to one service.
 *
 * A project is tied to a service explicitly through `service_slug`. Projects
 * saved before that column existed only carry a free-text `category`, so an
 * untagged project whose category is exactly the service name is treated as
 * belonging to it. An explicit tag always wins: a project tagged with a
 * different service is never pulled into this list by the fallback.
 *
 * Both rules live here rather than in a controller so the service landing page
 * and any future surface (a service-filtered gallery, a sitemap, an RSS feed)
 * agree on what "this service's work" means.
 */
class ServiceProjectGallery
{
    /** Enough to fill a three-column grid without turning the page into a portfolio. */
    public const DEFAULT_LIMIT = 9;

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function forService(
        string $serviceSlug,
        string $serviceName = '',
        int $limit = self::DEFAULT_LIMIT,
    ): array {
        $serviceSlug = trim($serviceSlug);

        if ($serviceSlug === '') {
            return [];
        }

        try {
            $projects = GalleryProject::query()
                ->where('is_published', true)
                ->where(function (Builder $query) use ($serviceSlug, $serviceName): void {
                    $query->where('service_slug', $serviceSlug);

                    $name = trim($serviceName);

                    if ($name === '') {
                        return;
                    }

                    $query->orWhere(function (Builder $inner) use ($name): void {
                        $inner->whereNull('service_slug')
                            ->whereRaw('LOWER(category) = ?', [mb_strtolower($name)]);
                    });
                })
                ->orderBy('position')
                ->latest('id')
                ->limit(max(1, $limit))
                ->get();
        } catch (Throwable $exception) {
            Log::warning('Unable to load gallery projects for a service landing page.', [
                'service' => $serviceSlug,
                'message' => $exception->getMessage(),
            ]);

            return [];
        }

        return $projects
            ->map(static fn (GalleryProject $project): array => self::payload($project))
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private static function payload(GalleryProject $project): array
    {
        $image = PublicContentSecurity::sanitizeRelativePathOrHttpUrl($project->image_path);

        return [
            'id' => $project->id,
            'title' => (string) $project->title,
            'category' => $project->category ?: 'Creative Work',
            'description' => (string) ($project->description ?? ''),
            'image' => $image ?? '/logo-07.svg',
            // Width variants travel with the page so the grid can emit a srcset
            // instead of forcing every visitor to download the full-size upload.
            'image_variants' => Media::variants($image),
            'project_url' => PublicContentSecurity::sanitizeRelativePathOrHttpUrl($project->project_url),
        ];
    }
}
