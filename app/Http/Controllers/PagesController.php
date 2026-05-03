<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\BlogPost;
use App\Models\GalleryProject;
use App\Models\SlideShow;
use App\Support\ServiceOrderCatalog;
use App\Support\SubscriptionPlanCatalog;
use Inertia\Inertia;

class PagesController extends Controller
{
    public function index()
    {
        return Inertia::render('Home');
    }

    public function welcomePage(SubscriptionPlanCatalog $subscriptionPlanCatalog)
    {
        return Inertia::render('Welcome', [
            'slideShows' => SlideShow::query()
                ->latest('id')
                ->get(['id', 'slide_title', 'text', 'slide_image', 'slide_link', 'slide_link_text']),
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
                'image' => $this->publicAssetUrl((string) $project->image_path),
                'project_url' => $project->project_url,
                'source' => 'uploaded',
            ])
            ->values();

        return Inertia::render('Gallery', [
            'projects' => $projects->isNotEmpty()
                ? $projects
                : $this->fallbackGallerySamples(),
        ]);
    }

    public function contactPage()
    {
        return Inertia::render('Contact');
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
                    'image' => $event->image_path ? $this->publicAssetUrl((string) $event->image_path) : null,
                    'registration_url' => $event->registration_url,
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
                'id' => 'sample-wingram',
                'title' => 'Wingram Identity',
                'category' => 'Brand Design',
                'description' => 'A clean identity sample from the public Bellah Options asset library.',
                'image' => '/Wingram-07.png',
                'project_url' => null,
                'source' => 'sample',
            ],
            [
                'id' => 'sample-boss',
                'title' => 'BOSS Platform',
                'category' => 'Web Design',
                'description' => 'Visual direction for a business-first web experience.',
                'image' => '/BOSS-logo-02.svg',
                'project_url' => null,
                'source' => 'sample',
            ],
            [
                'id' => 'sample-reup',
                'title' => 'Reup Brand Asset',
                'category' => 'Visual Identity',
                'description' => 'Public sample artwork used to show Bellah Options brand range.',
                'image' => '/reup-05.svg',
                'project_url' => null,
                'source' => 'sample',
            ],
            [
                'id' => 'sample-terranize',
                'title' => 'Terranize Campaign',
                'category' => 'Graphic Design',
                'description' => 'Campaign-style artwork pulled from the existing public library.',
                'image' => '/terranize.PNG',
                'project_url' => null,
                'source' => 'sample',
            ],
            [
                'id' => 'sample-perkpay',
                'title' => 'Perkpay Visual',
                'category' => 'Digital Design',
                'description' => 'A polished product visual sample from Bellah Options assets.',
                'image' => '/perkpay.PNG',
                'project_url' => null,
                'source' => 'sample',
            ],
            [
                'id' => 'sample-flux',
                'title' => 'Flux Creative',
                'category' => 'Creative Direction',
                'description' => 'A visual sample showing bold digital composition and contrast.',
                'image' => '/fluxe.png',
                'project_url' => null,
                'source' => 'sample',
            ],
        ];
    }

    private function publicAssetUrl(string $path): string
    {
        if (preg_match('/^https?:\/\//i', $path)) {
            return $path;
        }

        return str_starts_with($path, '/') ? $path : '/'.$path;
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
            'cover_image' => $post->cover_image ? $this->publicAssetUrl((string) $post->cover_image) : null,
            'url' => route('blog.show', $post),
        ];
    }
}
