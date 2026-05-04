<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GalleryProject;
use App\Support\PublicContentSecurity;
use App\Support\WebpImageConverter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
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
        $previousImagePath = $gallery->image_path;
        $payload = $this->validatedData($request);

        $gallery->update($payload);

        if (
            is_string($previousImagePath)
            && $previousImagePath !== ''
            && $previousImagePath !== ($payload['image_path'] ?? null)
        ) {
            $this->deleteIfManagedUpload($previousImagePath);
        }

        return back()->with('success', 'Gallery project updated.');
    }

    public function destroy(GalleryProject $gallery): RedirectResponse
    {
        $this->deleteIfManagedUpload($gallery->image_path);
        $gallery->delete();

        return back()->with('success', 'Gallery project deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedData(Request $request): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'category' => ['nullable', 'string', 'max:80'],
            'description' => ['nullable', 'string'],
            'image_upload' => [
                'nullable',
                'file',
                'mimetypes:image/jpeg,image/png,image/gif,image/webp,image/bmp,image/x-ms-bmp',
                'max:8192',
            ],
            'image_path' => [
                'nullable',
                'string',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value === null || trim((string) $value) === '') {
                        return;
                    }

                    if (PublicContentSecurity::isSafeRelativePathOrHttpUrl($value)) {
                        return;
                    }

                    $fail('Image path must be a valid http(s) URL or a safe public path starting with "/".');
                },
            ],
            'project_url' => [
                'nullable',
                'string',
                'max:255',
                'url:http,https',
            ],
            'is_published' => ['boolean'],
            'position' => ['nullable', 'integer', 'min:0'],
        ]);

        $uploadedPath = null;
        if ($request->hasFile('image_upload')) {
            $upload = $request->file('image_upload');
            if (! $upload instanceof UploadedFile) {
                throw ValidationException::withMessages([
                    'image_upload' => 'Please upload a valid image file.',
                ]);
            }

            try {
                $stored = app(WebpImageConverter::class)->storePublicWebp(
                    $upload,
                    'gallery-projects',
                );
            } catch (\RuntimeException $exception) {
                throw ValidationException::withMessages([
                    'image_upload' => $exception->getMessage(),
                ]);
            }

            if ($stored !== '') {
                $uploadedPath = '/storage/'.$stored;
            }
        }

        $imagePath = $uploadedPath
            ?? PublicContentSecurity::sanitizeRelativePathOrHttpUrl($data['image_path'] ?? null);

        if (! is_string($imagePath) || $imagePath === '') {
            throw ValidationException::withMessages([
                'image_path' => 'Please upload an image or provide a valid image URL/public path.',
            ]);
        }

        return [
            ...$data,
            'title' => trim((string) $data['title']),
            'category' => PublicContentSecurity::normalizeNullableText($data['category'] ?? null),
            'description' => PublicContentSecurity::normalizeNullableText($data['description'] ?? null),
            'image_path' => $imagePath,
            'project_url' => PublicContentSecurity::normalizeNullableText($data['project_url'] ?? null),
            'position' => (int) ($data['position'] ?? 0),
        ];
    }

    private function deleteIfManagedUpload(mixed $path): void
    {
        if (! is_string($path) || ! str_starts_with($path, '/storage/gallery-projects/')) {
            return;
        }

        $storagePath = ltrim(substr($path, strlen('/storage/')), '/');
        if ($storagePath !== '') {
            Storage::disk('public')->delete($storagePath);
        }
    }
}
