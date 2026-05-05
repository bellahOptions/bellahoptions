<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\BlogPost;
use App\Models\GalleryProject;
use App\Models\SlideShow;
use App\Models\Term;
use App\Support\PublicContentSecurity;
use App\Support\ServiceOrderCatalog;
use App\Support\SubscriptionPlanCatalog;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Throwable;

class PagesController extends Controller
{
    public function index()
    {
        return Inertia::render('Home');
    }

    public function welcomePage(
        SubscriptionPlanCatalog $subscriptionPlanCatalog,
        ServiceOrderCatalog $serviceOrderCatalog
    )
    {
        $slideShows = collect();
        try {
            $slideShows = SlideShow::query()
                ->latest('id')
                ->get(['id', 'slide_title', 'text', 'slide_image', 'slide_link', 'slide_link_text'])
                ->map(function (SlideShow $slide) use ($serviceOrderCatalog): ?array {
                    try {
                        $safeImage = $this->publicAssetUrl($slide->slide_image);
                        if (is_string($slide->slide_image) && trim($slide->slide_image) !== '' && $safeImage === null) {
                            return null;
                        }

                        return [
                            'id' => $slide->id,
                            'slide_title' => $slide->slide_title,
                            'text' => $slide->text,
                            'slide_image' => $safeImage,
                            'slide_link' => $this->normalizeSlideOrderLink($slide->slide_link, $serviceOrderCatalog),
                            'slide_link_text' => $slide->slide_link_text,
                        ];
                    } catch (Throwable $exception) {
                        Log::warning('Skipping malformed welcome slide.', [
                            'slide_id' => $slide->id,
                            'message' => $exception->getMessage(),
                        ]);

                        return null;
                    }
                })
                ->filter()
                ->values();
        } catch (Throwable $exception) {
            Log::warning('Unable to load welcome slides.', [
                'message' => $exception->getMessage(),
            ]);
        }

        $gallerySamples = collect();
        try {
            $gallerySamples = GalleryProject::query()
                ->where('is_published', true)
                ->orderBy('position')
                ->latest('id')
                ->limit(4)
                ->get()
                ->map(fn (GalleryProject $project): array => [
                    'id' => $project->id,
                    'title' => $project->title,
                    'service' => $project->category ?: 'Creative Work',
                    'image' => $this->publicAssetUrl($project->image_path) ?? '/logo-07.svg',
                    'summary' => $project->description ?: 'Uploaded by Bellah Options super-admin.',
                    'href' => PublicContentSecurity::sanitizeRelativePathOrHttpUrl($project->project_url) ?: '/gallery',
                ])
                ->values();
        } catch (Throwable $exception) {
            Log::warning('Unable to load homepage gallery samples.', [
                'message' => $exception->getMessage(),
            ]);
        }

        return Inertia::render('Welcome', [
            'slideShows' => $slideShows,
            'featuredPlans' => $subscriptionPlanCatalog->homepagePlans(3),
            'gallerySamples' => $gallerySamples,
        ]);
    }

    public function aboutPage()
    {
        return Inertia::render('About');
    }

    public function servicesPage(ServiceOrderCatalog $catalog)
    {
        return Inertia::render('Services', [
            'services' => collect($catalog->all())
                ->map(fn (array $service, string $slug): array => [
                    'slug' => $slug,
                    'name' => (string) ($service['name'] ?? ucfirst($slug)),
                    'description' => (string) ($service['description'] ?? ''),
                    'packages' => collect((array) ($service['packages'] ?? []))
                        ->map(fn (array $package, string $packageCode): array => [
                            'code' => $packageCode,
                            'name' => (string) ($package['name'] ?? ucfirst($packageCode)),
                            'description' => (string) ($package['description'] ?? ''),
                            'price' => round((float) ($package['price'] ?? 0), 2),
                        ])
                        ->values(),
                ])
                ->values(),
        ]);
    }

    public function galleryPage()
    {
        $projects = collect();
        try {
            $projects = GalleryProject::query()
                ->where('is_published', true)
                ->orderBy('position')
                ->latest('id')
                ->get()
                ->map(fn (GalleryProject $project): array => [
                    'id' => $project->id,
                    'title' => $project->title,
                    'category' => $project->category ?: 'Creative Work',
                    'description' => $project->description ?: '',
                    'image' => $this->publicAssetUrl($project->image_path) ?? '/logo-07.svg',
                    'project_url' => PublicContentSecurity::sanitizeRelativePathOrHttpUrl($project->project_url),
                    'source' => 'uploaded',
                ])
                ->values();
        } catch (Throwable $exception) {
            Log::warning('Unable to load gallery projects.', [
                'message' => $exception->getMessage(),
            ]);
        }

        return Inertia::render('Gallery', [
            'projects' => $projects,
        ]);
    }

    public function webDesignSamplesPage()
    {
        return Inertia::render('WebDesignSamples');
    }

    public function contactPage(Request $request)
    {
        return Inertia::render('Contact', $this->createContactHumanChallenge($request));
    }

    public function blogPage()
    {
        return Inertia::render('Blog', [
            'posts' => BlogPost::query()
                ->where('is_published', true)
                ->orderBy('position')
                ->latest('published_at')
                ->latest('id')
                ->get()
                ->map(fn (BlogPost $post): array => $this->blogPostSummary($post))
                ->values(),
        ]);
    }

    public function blogShowPage(BlogPost $blogPost)
    {
        abort_unless($blogPost->is_published, 404);

        return Inertia::render('BlogShow', [
            'post' => [
                ...$this->blogPostSummary($blogPost),
                'body' => $blogPost->body ?: $blogPost->excerpt,
            ],
            'relatedPosts' => BlogPost::query()
                ->where('is_published', true)
                ->whereKeyNot($blogPost->id)
                ->when($blogPost->category, fn ($query) => $query->where('category', $blogPost->category))
                ->latest('published_at')
                ->limit(3)
                ->get()
                ->map(fn (BlogPost $post): array => $this->blogPostSummary($post))
                ->values(),
        ]);
    }

    public function eventsPage()
    {
        return Inertia::render('Events', [
            'events' => Event::query()
                ->where('is_published', true)
                ->orderByRaw('event_date is null')
                ->orderBy('event_date')
                ->orderBy('position')
                ->latest('id')
                ->get()
                ->map(fn (Event $event): array => [
                    'id' => $event->id,
                    'title' => $event->title,
                    'description' => $event->description ?: '',
                    'event_date' => $event->event_date?->toFormattedDateString(),
                    'location' => $event->location ?: 'To be announced',
                    'image' => $event->image_path ? $this->publicAssetUrl($event->image_path) : null,
                    'registration_url' => PublicContentSecurity::sanitizeRelativePathOrHttpUrl($event->registration_url),
                ])
                ->values(),
        ]);
    }

    private function publicAssetUrl(?string $path): ?string
    {
        $sanitized = PublicContentSecurity::sanitizeRelativePathOrHttpUrl($path);

        if ($sanitized === null) {
            return null;
        }

        return $sanitized;
    }

    private function normalizeSlideOrderLink(?string $url, ServiceOrderCatalog $catalog): ?string
    {
        $sanitized = PublicContentSecurity::sanitizeRelativePathOrHttpUrl($url);
        if (! is_string($sanitized) || $sanitized === '') {
            return null;
        }

        if (preg_match('#^/services/([a-z0-9-]+)([?\#].*)?$#i', $sanitized, $matches) !== 1) {
            return $sanitized;
        }

        $serviceSlug = strtolower((string) ($matches[1] ?? ''));
        if (! is_array($catalog->service($serviceSlug))) {
            return $sanitized;
        }

        return '/order/'.$serviceSlug.((string) ($matches[2] ?? ''));
    }

    /**
     * @return array<string, mixed>
     */
    private function blogPostSummary(BlogPost $post): array
    {
        return [
            'id' => $post->id,
            'title' => $post->title,
            'slug' => $post->slug,
            'excerpt' => $post->excerpt ?: str($post->body ?: 'Bellah Options insights and creative direction.')->limit(160)->toString(),
            'category' => $post->category ?: 'Brand Growth',
            'author_name' => $post->author_name ?: 'Bellah Options',
            'published_at' => $post->published_at?->toFormattedDateString(),
            'cover_image' => $post->cover_image ? $this->publicAssetUrl($post->cover_image) : null,
            'url' => route('blog.show', $post),
        ];
    }

    /**
     * @return array{humanCheckQuestion: string, humanCheckNonce: string, formRenderedAt: int}
     */
    private function createContactHumanChallenge(Request $request): array
    {
        $left = random_int(2, 11);
        $right = random_int(2, 11);
        $issuedAt = now()->timestamp;
        $nonce = Str::random(32);

        $request->session()->put('contact_human_check', [
            'answer' => $left + $right,
            'issued_at' => $issuedAt,
            'nonce' => $nonce,
        ]);

        return [
            'humanCheckQuestion' => "What is {$left} + {$right}?",
            'humanCheckNonce' => $nonce,
            'formRenderedAt' => $issuedAt,
        ];
    }

    public function showTerms()
    {
        return Inertia::render('Legal/Terms', [
            'term' => $this->resolvePolicyTermPayload('terms'),
        ]);
    }

    public function showPrivacyPolicy()
    {
        return Inertia::render('Legal/Privacy', [
            'term' => $this->resolvePolicyTermPayload('privacy'),
        ]);
    }

    public function showCookiePolicy()
    {
        return Inertia::render('Legal/Cookies', [
            'term' => $this->resolvePolicyTermPayload('cookie'),
        ]);
    }

    /**
     * @return array{id:int,title:string,content:string,updated_at:?string}|null
     */
    private function resolvePolicyTermPayload(string $policy): ?array
    {
        try {
            $query = Term::query();

            $query->where(function ($builder) use ($policy): void {
                $builder
                    ->whereRaw('LOWER(title) LIKE ?', ["%{$policy}%"])
                    ->orWhereRaw('LOWER(title) = ?', [$policy]);
            });

            $term = $query->latest('updated_at')->first();
        } catch (Throwable $exception) {
            Log::warning('Unable to load policy term from database.', [
                'policy' => $policy,
                'message' => $exception->getMessage(),
            ]);

            return null;
        }

        if (! $term instanceof Term) {
            return null;
        }

        return [
            'id' => $term->id,
            'title' => (string) $term->title,
            'content' => (string) $term->content,
            'updated_at' => $term->updated_at?->toIso8601String(),
        ];
    }
}
