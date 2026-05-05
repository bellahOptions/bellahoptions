<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\BlogPost;
use App\Models\GalleryProject;
use App\Models\SlideShow;
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
        return Inertia::render('Welcome', [
            'slideShows' => SlideShow::query()
                ->latest('id')
                ->get(['id', 'slide_title', 'text', 'slide_image', 'slide_link', 'slide_link_text'])
                ->map(function (SlideShow $slide) use ($serviceOrderCatalog): ?array {
                    try {
                        return [
                            'id' => $slide->id,
                            'slide_title' => $slide->slide_title,
                            'text' => $slide->text,
                            'slide_image' => $this->publicAssetUrl($slide->slide_image),
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
                ->values(),
            'featuredPlans' => $subscriptionPlanCatalog->homepagePlans(3),
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

        return Inertia::render('Gallery', [
            'projects' => $projects->isNotEmpty()
                ? $projects
                : $this->fallbackGallerySamples(),
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

    /**
     * @return array<int, array<string, string|null>>
     */
    private function fallbackGallerySamples(): array
    {
        return [
            [
                'id' => 'sample-nexar-systems',
                'title' => 'Logo Design for Nexar Systems',
                'category' => 'Logo Design',
                'description' => 'A modern identity crafted for Nexar Systems on Behance.',
                'image' => '/Wingram-07.png',
                'project_url' => 'https://www.behance.net/gallery/246255317/Logo-design-for-Nexar-Systems',
                'source' => 'sample',
            ],
            [
                'id' => 'sample-logofolio-v1',
                'title' => 'Logofolio v1',
                'category' => 'Logo Collection',
                'description' => 'Selected logo explorations showcasing versatile brand directions.',
                'image' => '/Wingram-08.png',
                'project_url' => 'https://www.behance.net/gallery/242705853/Logofolio-v1',
                'source' => 'sample',
            ],
            [
                'id' => 'sample-cdcare-app',
                'title' => 'CDCare App Reimagined',
                'category' => 'UI/UX Design',
                'description' => 'A product design and experience refresh for the CDCare app.',
                'image' => '/Wingram-09.png',
                'project_url' => 'https://www.behance.net/gallery/240637753/CDCare-App-Reimagined',
                'source' => 'sample',
            ],
            [
                'id' => 'sample-wisepulse',
                'title' => 'Brand Logo Design for WisePulse',
                'category' => 'Brand Design',
                'description' => 'A strategic logo system built for a standout brand presence.',
                'image' => '/terranize.PNG',
                'project_url' => 'https://www.behance.net/gallery/234391241/Brand-Logo-design-for-WisePulse',
                'source' => 'sample',
            ],
            [
                'id' => 'sample-wingram-identity',
                'title' => 'Brand Identity System for Wingram',
                'category' => 'Brand Design',
                'description' => 'Full identity system by Bellah Options for Wingram.',
                'image' => '/perkpay.PNG',
                'project_url' => 'https://www.behance.net/gallery/233003719/Brand-Identity-System-for-Wingram-by-Bellah-Options',
                'source' => 'sample',
            ],
            [
                'id' => 'sample-komchop',
                'title' => 'Street Food Brand Identity: KomChop',
                'category' => 'Brand Identity',
                'description' => 'Street-food branding built to feel energetic and memorable.',
                'image' => '/fluxe.png',
                'project_url' => 'https://www.behance.net/gallery/221970917/Street-Food-Brand-Identity-KomChop',
                'source' => 'sample',
            ],
            [
                'id' => 'sample-savingsbox',
                'title' => 'Social Media Designs for SavingsBox',
                'category' => 'Social Media Design',
                'description' => 'Creative social assets designed for consistency and reach.',
                'image' => '/reup-05.svg',
                'project_url' => 'https://www.behance.net/gallery/216593821/Social-Media-Designs-for-SavingsBox',
                'source' => 'sample',
            ],
            [
                'id' => 'sample-platinum-apparels',
                'title' => 'Platinum Apparels Brand Logo',
                'category' => 'Logo Design',
                'description' => 'A refined brand logo project for Platinum Apparels.',
                'image' => '/BOSS-logo-02.svg',
                'project_url' => 'https://www.behance.net/gallery/207917631/Platinum-Apparels-Brand-Logo',
                'source' => 'sample',
            ],
            [
                'id' => 'sample-marveled',
                'title' => 'Brand Identity for Marveled',
                'category' => 'Brand Identity',
                'description' => 'Identity direction for a marketing firm brand.',
                'image' => '/Marvbelked-01.png',
                'project_url' => 'https://www.behance.net/gallery/207534817/Brand-Identity-project-for-a-Marveled-a-Marketing-firm',
                'source' => 'sample',
            ],
            [
                'id' => 'sample-solvebills',
                'title' => 'SolveBills Brand Design Project',
                'category' => 'Brand Design',
                'description' => 'Comprehensive brand design crafted for SolveBills.',
                'image' => '/reup.PNG',
                'project_url' => 'https://www.behance.net/gallery/207024019/SolveBills-Brand-design-Project',
                'source' => 'sample',
            ],
            [
                'id' => 'sample-bw-xchange',
                'title' => 'Logo Design for BW Xchange',
                'category' => 'Logo Design',
                'description' => 'Logo design balancing personality and market clarity.',
                'image' => '/logo-06.svg',
                'project_url' => 'https://www.behance.net/gallery/167771977/Logo-Design-for-BW-Xchange',
                'source' => 'sample',
            ],
            [
                'id' => 'sample-kabes-clothing',
                'title' => 'Logo Redesign for Kabes Clothing',
                'category' => 'Logo Redesign',
                'description' => 'A refreshed mark tailored for stronger apparel branding.',
                'image' => '/logo-07.svg',
                'project_url' => 'https://www.behance.net/gallery/167435559/Logo-Redesign-for-Kabes-Clothing',
                'source' => 'sample',
            ],
            [
                'id' => 'sample-product-logo-brand',
                'title' => 'Product Design + Logo + Brand Design',
                'category' => 'Product & Brand Design',
                'description' => 'Multi-discipline project combining product, logo, and brand work.',
                'image' => '/logo-08.svg',
                'project_url' => 'https://www.behance.net/gallery/166047879/Product-Design-Logo-Design-brand-design',
                'source' => 'sample',
            ],
            [
                'id' => 'sample-behance-portfolio',
                'title' => 'Explore More Behance Projects',
                'category' => 'Portfolio',
                'description' => 'Browse the full Bellah Options Behance portfolio for additional work.',
                'image' => '/bellah.jpg',
                'project_url' => 'https://www.behance.net/bellahoptionsNG',
                'source' => 'sample',
            ],
        ];
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

        if (preg_match('#^/services/([a-z0-9-]+)([?#].*)?$#i', $sanitized, $matches) !== 1) {
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
}
