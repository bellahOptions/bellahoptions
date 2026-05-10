<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\BlogPost;
use App\Models\Faq;
use App\Models\GalleryProject;
use App\Models\SlideShow;
use App\Models\Term;
use App\Support\PublicContentSecurity;
use App\Support\HumanVerification;
use App\Support\PlatformSettings;
use App\Support\ServiceOrderCatalog;
use App\Support\SlideBackgroundOptions;
use App\Support\SubscriptionPlanCatalog;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Http\Request;
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
            $slideColumns = ['id', 'slide_title', 'text', 'slide_image', 'slide_link', 'slide_link_text'];
            $hasSlideBackgroundColumn = Schema::hasTable('slide_shows') && Schema::hasColumn('slide_shows', 'slide_background');
            $hasContentMediaTypeColumn = Schema::hasTable('slide_shows') && Schema::hasColumn('slide_shows', 'content_media_type');
            $hasContentMediaPathColumn = Schema::hasTable('slide_shows') && Schema::hasColumn('slide_shows', 'content_media_path');
            $hasContentMediaPositionColumn = Schema::hasTable('slide_shows') && Schema::hasColumn('slide_shows', 'content_media_position');
            $hasContentMediaAlignmentColumn = Schema::hasTable('slide_shows') && Schema::hasColumn('slide_shows', 'content_media_alignment');
            $hasLayoutStyleColumn = Schema::hasTable('slide_shows') && Schema::hasColumn('slide_shows', 'layout_style');
            $hasContentAlignmentColumn = Schema::hasTable('slide_shows') && Schema::hasColumn('slide_shows', 'content_alignment');
            $hasTitleAnimationColumn = Schema::hasTable('slide_shows') && Schema::hasColumn('slide_shows', 'title_animation');
            $hasTextAnimationColumn = Schema::hasTable('slide_shows') && Schema::hasColumn('slide_shows', 'text_animation');
            $hasMediaAnimationColumn = Schema::hasTable('slide_shows') && Schema::hasColumn('slide_shows', 'media_animation');
            $hasButtonAnimationColumn = Schema::hasTable('slide_shows') && Schema::hasColumn('slide_shows', 'button_animation');
            if ($hasSlideBackgroundColumn) {
                $slideColumns[] = 'slide_background';
            }
            if ($hasContentMediaTypeColumn) {
                $slideColumns[] = 'content_media_type';
            }
            if ($hasContentMediaPathColumn) {
                $slideColumns[] = 'content_media_path';
            }
            if ($hasContentMediaPositionColumn) {
                $slideColumns[] = 'content_media_position';
            }
            if ($hasContentMediaAlignmentColumn) {
                $slideColumns[] = 'content_media_alignment';
            }
            if ($hasLayoutStyleColumn) {
                $slideColumns[] = 'layout_style';
            }
            if ($hasContentAlignmentColumn) {
                $slideColumns[] = 'content_alignment';
            }
            if ($hasTitleAnimationColumn) {
                $slideColumns[] = 'title_animation';
            }
            if ($hasTextAnimationColumn) {
                $slideColumns[] = 'text_animation';
            }
            if ($hasMediaAnimationColumn) {
                $slideColumns[] = 'media_animation';
            }
            if ($hasButtonAnimationColumn) {
                $slideColumns[] = 'button_animation';
            }

            $slideShows = SlideShow::query()
                ->latest('id')
                ->get($slideColumns)
                ->map(function (SlideShow $slide) use (
                    $serviceOrderCatalog,
                    $hasContentMediaTypeColumn,
                    $hasContentMediaPathColumn,
                    $hasContentMediaPositionColumn,
                    $hasContentMediaAlignmentColumn,
                    $hasLayoutStyleColumn,
                    $hasContentAlignmentColumn,
                    $hasTitleAnimationColumn,
                    $hasTextAnimationColumn,
                    $hasMediaAnimationColumn,
                    $hasButtonAnimationColumn
                ): ?array {
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
                            'slide_background' => SlideBackgroundOptions::sanitize($slide->slide_background ?? null),
                            'content_media_type' => $this->normalizeSlideContentMediaType($hasContentMediaTypeColumn ? $slide->content_media_type : null),
                            'content_media_path' => $this->publicAssetUrl($hasContentMediaPathColumn ? $slide->content_media_path : null),
                            'content_media_position' => $this->normalizeSlideContentMediaPosition($hasContentMediaPositionColumn ? $slide->content_media_position : null),
                            'content_media_alignment' => $this->normalizeSlideContentMediaAlignment($hasContentMediaAlignmentColumn ? $slide->content_media_alignment : null),
                            'layout_style' => $this->normalizeSlideLayoutStyle($hasLayoutStyleColumn ? $slide->layout_style : null),
                            'content_alignment' => $this->normalizeSlideContentAlignment($hasContentAlignmentColumn ? $slide->content_alignment : null),
                            'title_animation' => $this->normalizeSlideAnimationStyle($hasTitleAnimationColumn ? $slide->title_animation : null),
                            'text_animation' => $this->normalizeSlideAnimationStyle($hasTextAnimationColumn ? $slide->text_animation : null),
                            'media_animation' => $this->normalizeSlideAnimationStyle($hasMediaAnimationColumn ? $slide->media_animation : null),
                            'button_animation' => $this->normalizeSlideAnimationStyle($hasButtonAnimationColumn ? $slide->button_animation : null),
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
                    'summary' => $project->description ?: 'Uploaded by the Bellah Options team.',
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
                            'original_price' => round((float) ($package['original_price'] ?? $package['price'] ?? 0), 2),
                            'discount_price' => isset($package['discount_price']) && is_numeric($package['discount_price'])
                                ? round((float) $package['discount_price'], 2)
                                : null,
                            'is_recommended' => (bool) ($package['is_recommended'] ?? false),
                            'features' => is_array($package['features'] ?? null) ? array_values($package['features']) : [],
                            'sample_image' => $package['sample_image'] ?? null,
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

    public function manageHiresPage()
    {
        return Inertia::render('ManageHires', [
            'landing' => PlatformSettings::manageHiresLanding(),
        ]);
    }

    public function contactPage(Request $request)
    {
        return Inertia::render('Contact', HumanVerification::createChallenge($request, 'contact_human_check'));
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

    public function faqsPage()
    {
        $faqs = collect();

        try {
            $faqs = Faq::query()
                ->where('is_published', true)
                ->orderBy('position')
                ->latest('id')
                ->get()
                ->map(fn (Faq $faq): array => [
                    'id' => $faq->id,
                    'question' => $faq->question,
                    'answer' => $faq->answer,
                    'category' => $faq->category ?: 'General',
                ])
                ->values();
        } catch (Throwable $exception) {
            Log::warning('Unable to load published FAQs.', [
                'message' => $exception->getMessage(),
            ]);
        }

        return Inertia::render('Faqs', [
            'faqs' => $faqs,
        ]);
    }

    public function reviewsPage()
    {
        return Inertia::render('Reviews');
    }

    public function seoModulesFunctionsPage()
    {
        return Inertia::render('SeoModulesFunctions', [
            'modules' => [
                [
                    'title' => 'Technical SEO Module',
                    'description' => 'Covers crawlability, indexation, HTTPS integrity, core page speed, and schema health.',
                ],
                [
                    'title' => 'On-Page SEO Module',
                    'description' => 'Aligns page titles, headings, keyword intent, and internal linking for stronger relevance.',
                ],
                [
                    'title' => 'Local SEO Module',
                    'description' => 'Improves location signals, business profile consistency, and local visibility performance.',
                ],
                [
                    'title' => 'Content SEO Module',
                    'description' => 'Builds structured topic clusters and editorial optimization for discovery and engagement.',
                ],
            ],
            'functions' => [
                [
                    'title' => 'Keyword Mapping',
                    'description' => 'Maps target search intent to service pages, blog pages, and conversion-focused content.',
                ],
                [
                    'title' => 'Metadata Optimization',
                    'description' => 'Improves title tags, meta descriptions, and Open Graph tags to support search and social CTR.',
                ],
                [
                    'title' => 'Schema & Rich Results',
                    'description' => 'Implements structured data to increase SERP clarity and rich result eligibility.',
                ],
                [
                    'title' => 'SEO Monitoring',
                    'description' => 'Tracks rankings, index status, broken links, and technical regressions for ongoing improvements.',
                ],
            ],
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

    private function normalizeSlideContentMediaType(?string $value): ?string
    {
        $candidate = strtolower(trim((string) $value));
        if ($candidate === '') {
            return null;
        }

        return in_array($candidate, ['image', 'video'], true) ? $candidate : null;
    }

    private function normalizeSlideLayoutStyle(?string $value): string
    {
        $candidate = strtolower(trim((string) $value));
        if (in_array($candidate, ['center', 'split-left', 'split-right'], true)) {
            return $candidate;
        }

        return 'center';
    }

    private function normalizeSlideContentMediaPosition(?string $value): string
    {
        $candidate = strtolower(trim((string) $value));
        if (in_array($candidate, ['top', 'center', 'bottom'], true)) {
            return $candidate;
        }

        return 'center';
    }

    private function normalizeSlideContentMediaAlignment(?string $value): string
    {
        $candidate = strtolower(trim((string) $value));
        if (in_array($candidate, ['left', 'center', 'right'], true)) {
            return $candidate;
        }

        return 'center';
    }

    private function normalizeSlideContentAlignment(?string $value): string
    {
        $candidate = strtolower(trim((string) $value));
        if (in_array($candidate, ['left', 'center'], true)) {
            return $candidate;
        }

        return 'center';
    }

    private function normalizeSlideAnimationStyle(?string $value): string
    {
        $candidate = strtolower(trim((string) $value));
        if (in_array($candidate, ['fade-up', 'fade-down', 'slide-left', 'slide-right', 'zoom-in', 'none'], true)) {
            return $candidate;
        }

        return 'fade-up';
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
