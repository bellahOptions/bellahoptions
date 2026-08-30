<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\BlogPost;
use App\Models\Faq;
use App\Models\GalleryProject;
use App\Models\Term;
use App\Support\PublicContentSecurity;
use App\Support\HumanVerification;
use App\Support\PlatformSettings;
use App\Support\ServiceOrderCatalog;
use App\Support\SubscriptionPlanCatalog;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Inertia\Inertia;
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
