<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GalleryProject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GalleryProjectController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Gallery/Index', [
            'items' => GalleryProject::query()
                ->orderBy('position')
                ->latest('id')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        GalleryProject::query()->create([
            ...$this->validatedData($request),
            'uploaded_by' => $request->user()?->id,
        ]);

        return back()->with('success', 'Gallery project added.');
    }

    public function update(Request $request, GalleryProject $gallery): RedirectResponse
    {
        $gallery->update($this->validatedData($request));

        return back()->with('success', 'Gallery project updated.');
    }

    public function destroy(GalleryProject $gallery): RedirectResponse
    {
        $gallery->delete();

        return back()->with('success', 'Gallery project deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedData(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'category' => ['nullable', 'string', 'max:80'],
            'description' => ['nullable', 'string'],
            'image_path' => ['required', 'string', 'max:255'],
            'project_url' => ['nullable', 'string', 'max:255'],
            'is_published' => ['boolean'],
            'position' => ['nullable', 'integer', 'min:0'],
        ]);
    }
}
