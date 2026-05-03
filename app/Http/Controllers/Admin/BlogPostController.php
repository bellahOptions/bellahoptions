<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BlogPostController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Blog/Index', [
            'items' => BlogPost::query()
                ->orderBy('position')
                ->latest('published_at')
                ->latest('id')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        BlogPost::query()->create([
            ...$this->validatedData($request),
            'uploaded_by' => $request->user()?->id,
        ]);

        return back()->with('success', 'Blog post added.');
    }

    public function update(Request $request, BlogPost $blog): RedirectResponse
    {
        $blog->update($this->validatedData($request, $blog));

        return back()->with('success', 'Blog post updated.');
    }

    public function destroy(BlogPost $blog): RedirectResponse
    {
        $blog->delete();

        return back()->with('success', 'Blog post deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedData(Request $request, ?BlogPost $blog = null): array
    {
        $request->merge([
            'slug' => Str::slug((string) ($request->input('slug') ?: $request->input('title'))),
        ]);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'slug' => [
                'required',
                'string',
                'max:200',
                Rule::unique('blog_posts', 'slug')->ignore($blog?->id),
            ],
            'excerpt' => ['nullable', 'string', 'max:260'],
            'body' => ['nullable', 'string'],
            'cover_image' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:80'],
            'author_name' => ['nullable', 'string', 'max:120'],
            'is_published' => ['boolean'],
            'published_at' => ['nullable', 'date'],
            'position' => ['nullable', 'integer', 'min:0'],
        ]);

        return $data;
    }
}
