<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\BlogPost;
use App\Models\Faq;
use App\Models\GalleryProject;
use App\Models\Term;
use App\Services\PaymentReadinessService;
use App\Support\PublicContentSecurity;
use App\Support\HumanVerification;
use App\Support\Media;
use App\Support\PlatformSettings;
use App\Support\PolicyContent;
use App\Support\PolicyContentParser;
use App\Support\ServiceLandingContent;
use App\Support\ServiceProjectGallery;
use App\Support\ServiceOrderCatalog;
use App\Support\SubscriptionPlanCatalog;
use App\Support\VisitorLocalization;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PagesController extends Controller
{
    public function index()
    {
        return Inertia::render('Home');
    }

    public function welcomePage(SubscriptionPlanCatalog $subscriptionPlanCatalog)
    {
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
            'services' => $this->servicesPayload($catalog),
        ]);
    }

    public function serviceShowPage(
        string $serviceSlug,
        ServiceOrderCatalog $catalog,
    ) {
        $service = $catalog->service($serviceSlug);
        abort_unless(is_array($service), 404);

        $localization = app(VisitorLocalization::class)->resolve(request());
        $orderSlug = $catalog->orderSlug($serviceSlug);
        $content = ServiceLandingContent::for($serviceSlug, $service);

        // A super-admin override wins over the artwork shipped with the service.
        $imageOverride = PlatformSettings::serviceImages()[$serviceSlug] ?? null;

        if (is_string($imageOverride) && $imageOverride !== '') {
            $content['image'] = $imageOverride;
        }

        // Width variants travel with the page so the hero can emit a srcset and
        // the browser downloads a file sized for the viewport.
        $content['image_variants'] = Media::variants($content['image'] ?? null);

        // Related services come from the catalogue so a new service appears here
        // automatically instead of needing a template edit.
        $related = collect($this->servicesPayload($catalog))
            ->reject(fn (array $candidate): bool => in_array($candidate['slug'], [$serviceSlug, $orderSlug], true))
            ->take(4)
            ->values()
            ->all();

        return Inertia::render('ServiceDetail', [
            'service' => [
                'slug' => $serviceSlug,
                'order_slug' => $orderSlug,
                'name' => (string) ($service['name'] ?? ucfirst($serviceSlug)),
                'description' => (string) ($service['description'] ?? ''),
                'packages' => $this->packagePayload($service),
            ],
            'content' => $content,
            'relatedServices' => $related,
            // Work that belongs to this service, so the landing page can show
            // real examples instead of only describing what is delivered.
            'projects' => ServiceProjectGallery::forService(
                $serviceSlug,
                (string) ($service['name'] ?? ''),
            ),
            'orderUrl' => route('orders.create', $orderSlug, absolute: false),
            'paymentReadiness' => app(PaymentReadinessService::class)->forVisitor($localization),
        ]);
    }

    /**
     * Public service cards used by both /services and the landing pages.
     *
     * @return array<int, array<string, mixed>>
     */
    private function servicesPayload(ServiceOrderCatalog $catalog): array
    {
        return collect($catalog->all())
            ->map(fn (array $service, string $slug): array => [
                'slug' => $slug,
                'name' => (string) ($service['name'] ?? ucfirst($slug)),
                'description' => (string) ($service['description'] ?? ''),
                'packages' => $this->packagePayload($service),
            ])
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $service
     * @return array<int, array<string, mixed>>
     */
    private function packagePayload(array $service): array
    {
        return collect((array) ($service['packages'] ?? []))
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
            ->values()
            ->all();
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

    public function manageHiresPage(ServiceOrderCatalog $catalog)
    {
        $service = $catalog->service('manage-hires');

        return Inertia::render('ManageHires', [
            'whatsappUrl' => PlatformSettings::contactInfo()['whatsapp_url'] ?? '',
            'packages' => is_array($service) ? ($service['packages'] ?? []) : [],
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

    public function maintenancePage()
    {
        return Inertia::render('Maintenance');
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
        return $this->renderPolicyPage('terms');
    }

    public function showPrivacyPolicy()
    {
        return $this->renderPolicyPage('privacy');
    }

    public function showCookiePolicy()
    {
        return $this->renderPolicyPage('cookie');
    }

    /**
     * Render a legal policy page.
     *
     * Content precedence: an admin-edited record (parsed into sections) wins;
     * otherwise the built-in copy from PolicyContent is used. Before this, only
     * terms had built-in copy — privacy and cookie rendered an empty body on a
     * fresh install because their only content lived in admin-editable records.
     *
     * The page is rendered through Inertia so it shares the site's dark theme,
     * navigation and footer. It previously used a separate light Blade layout.
     *
     * Title, badge, hero copy, notice and "at a glance" facts all come from
     * PolicyContent::metaFor(), which is the single source of truth for these
     * pages. They used to be duplicated here as well, and the two copies had
     * already drifted apart (the terms phone number differed), so the inline
     * arrays were removed rather than kept in sync by hand.
     *
     * @param  array<string, mixed>  $meta  Optional per-page overrides; anything omitted falls back to PolicyContent::metaFor().
     */
    private function renderPolicyPage(string $policyKey, array $meta = []): Response
    {
        $termPayload = $this->resolvePolicyTermPayload($policyKey);
        $sections = $termPayload !== null ? PolicyContentParser::resolveSections($termPayload['content']) : [];

        if ($sections === []) {
            // No admin content at all: use the built-in copy. This is the case
            // that used to render privacy and cookie with an empty body.
            $sections = PolicyContent::sectionsFor($policyKey);
        } else {
            // Admin content exists and parsed. It wins even when the parser could
            // only produce a single generic section — that is still the wording
            // the operator wrote, and overriding it with built-in copy would
            // silently discard their edit.
            $sections = PolicyContent::normalize($sections);
        }

        // Admin-configured metadata wins over the built-in copy for the fields it
        // actually provides.
        $defaults = PolicyContent::metaFor($policyKey);

        return Inertia::render('Policy', [
            'policy' => [
                'key' => $policyKey,
                'title' => (string) ($meta['title'] ?? $defaults['title']),
                'badge' => (string) ($meta['badge'] ?? $defaults['badge']),
                'heroDescription' => (string) ($meta['heroDescription'] ?? $defaults['heroDescription']),
                'notice' => (string) ($meta['notice'] ?? $defaults['notice']),
            ],
            'sections' => array_values($sections),
            'metaItems' => array_values((array) ($meta['metaItems'] ?? $defaults['metaItems'])),
            'updatedAt' => $termPayload !== null && ! empty($termPayload['updated_at'])
                ? \Illuminate\Support\Carbon::parse((string) $termPayload['updated_at'])->format('F j, Y')
                : null,
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
