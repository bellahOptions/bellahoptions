<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GalleryProject;
use App\Support\PublicContentSecurity;
use App\Support\WebpImageConverter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class GalleryProjectController extends Controller
{
    public function index(): Response
    {
        if (! Schema::hasTable('gallery_projects')) {
            return Inertia::render('Admin/Gallery/Index', [
                'items' => [],
                'mediaLibrary' => $this->mediaLibraryPayload(),
            ]);
        }

        return Inertia::render('Admin/Gallery/Index', [
            'items' => GalleryProject::query()
                ->orderBy('position')
                ->latest('id')
                ->get(),
            'mediaLibrary' => $this->mediaLibraryPayload(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        if (! Schema::hasTable('gallery_projects')) {
            return back()->with('error', 'Gallery projects table is missing. Run migrations and try again.');
        }

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

    public function mediaIndex(): JsonResponse
    {
        return response()->json($this->mediaLibraryPayload());
    }

    public function upload(Request $request, WebpImageConverter $converter): JsonResponse
    {
        $validated = $request->validate([
            'file' => [
                'required',
                'file',
                'mimetypes:image/jpeg,image/png,image/gif,image/webp,image/bmp,image/x-ms-bmp,image/svg+xml,image/avif',
                'max:8192',
            ],
        ]);

        $file = $validated['file'] ?? null;
        if (! $file instanceof UploadedFile) {
            throw ValidationException::withMessages([
                'file' => 'Please upload a valid image file.',
            ]);
        }

        $extension = strtolower($file->getClientOriginalExtension());

        if ($extension === 'svg') {
            $storedPath = $file->storePublicly('gallery-projects', 'public');
            if (! is_string($storedPath) || $storedPath === '') {
                throw ValidationException::withMessages([
                    'file' => 'Unable to upload the selected SVG file.',
                ]);
            }

            $publicPath = '/storage/'.$storedPath;

            return response()->json([
                'path' => $publicPath,
                'url' => $publicPath,
                'message' => 'Image uploaded successfully.',
            ], 201);
        }

        try {
            $storedPath = $converter->storePublicWebp($file, 'gallery-projects');
        } catch (\RuntimeException $exception) {
            throw ValidationException::withMessages([
                'file' => $exception->getMessage(),
            ]);
        }

        $publicPath = '/storage/'.$storedPath;

        return response()->json([
            'path' => $publicPath,
            'url' => $publicPath,
            'message' => 'Image uploaded successfully.',
        ], 201);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedData(Request $request): array
    {
        $request->merge([
            'image_path' => PublicContentSecurity::sanitizeLenientRelativePathOrHttpUrl(
                $request->input('image_path')
            ),
        ]);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'category' => ['nullable', 'string', 'max:80'],
            'description' => ['nullable', 'string'],
            'image_path' => [
                'required',
                'string',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail): void {
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

        return [
            ...$data,
            'title' => trim((string) $data['title']),
            'category' => PublicContentSecurity::normalizeNullableText($data['category'] ?? null),
            'description' => PublicContentSecurity::normalizeNullableText($data['description'] ?? null),
            'image_path' => (string) PublicContentSecurity::sanitizeLenientRelativePathOrHttpUrl($data['image_path']),
            'project_url' => PublicContentSecurity::normalizeNullableText($data['project_url'] ?? null),
            'position' => (int) ($data['position'] ?? 0),
            'is_published' => (bool) ($data['is_published'] ?? false),
        ];
    }

    /**
     * @return array{files: array<int, array<string, mixed>>}
     */
    private function mediaLibraryPayload(): array
    {
        return [
            'files' => $this->listPublicMediaFiles(),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function listPublicMediaFiles(): array
    {
        $publicRoot = public_path();
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($publicRoot, \FilesystemIterator::SKIP_DOTS)
        );

        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp'];
        $excludedDirectories = ['build'];

        $files = [];

        foreach ($iterator as $file) {
            if (! $file instanceof \SplFileInfo || ! $file->isFile()) {
                continue;
            }

            $absolutePath = $file->getPathname();
            $relativePath = str_replace('\\', '/', ltrim(str_replace($publicRoot, '', $absolutePath), DIRECTORY_SEPARATOR));

            if ($relativePath === '') {
                continue;
            }

            $firstDirectory = strtok($relativePath, '/');
            if (is_string($firstDirectory) && in_array($firstDirectory, $excludedDirectories, true)) {
                continue;
            }

            $extension = strtolower((string) $file->getExtension());
            if (! in_array($extension, $allowedExtensions, true)) {
                continue;
            }

            $publicPath = '/'.$relativePath;
            if (! PublicContentSecurity::isSafeRelativePath($publicPath)) {
                continue;
            }

            $files[] = [
                'name' => $file->getFilename(),
                'path' => $publicPath,
                'directory' => dirname($publicPath) === '/' ? '/' : dirname($publicPath),
                'extension' => $extension,
                'size' => $file->getSize(),
                'updated_at' => date(DATE_ATOM, $file->getMTime()),
                'preview_url' => $publicPath,
            ];
        }

        usort($files, static fn (array $a, array $b): int => strcmp((string) $b['updated_at'], (string) $a['updated_at']));

        return array_values($files);
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
