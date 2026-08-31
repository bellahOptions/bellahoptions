<?php

namespace App\Http\Controllers\Admin;

use App\Contracts\ImageUploader;
use App\Http\Controllers\Controller;
use App\Models\GalleryProject;
use App\Models\MediaUpload;
use App\Support\PublicContentSecurity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

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

    public function upload(Request $request, ImageUploader $uploader): JsonResponse
    {
        $validated = $request->validate([
            'file' => [
                'required',
                'file',
                'mimetypes:image/jpeg,image/png,image/gif,image/webp,image/bmp,image/x-ms-bmp,image/avif',
                'max:8192',
            ],
            'crop_aspect' => ['nullable', 'string', 'in:free,1:1,4:3,16:9,3:4,9:16'],
        ]);

        $file = $validated['file'] ?? null;
        if (! $file instanceof UploadedFile) {
            throw ValidationException::withMessages([
                'file' => 'Please upload a valid image file.',
            ]);
        }

        try {
            $result = $uploader->uploadImage($file, 'gallery-projects', $validated['crop_aspect'] ?? null);
        } catch (RuntimeException $exception) {
            throw ValidationException::withMessages([
                'file' => $exception->getMessage(),
            ]);
        }

        $this->recordUpload($result, 'gallery-projects', $request->user()?->id);

        return response()->json([
            'path' => $result['secure_url'],
            'url' => $result['secure_url'],
            'message' => 'Image uploaded successfully.',
        ], 201);
    }

    public function crop(Request $request, ImageUploader $uploader): JsonResponse
    {
        $validated = $request->validate([
            'path' => ['required', 'string', 'max:2048'],
            'crop_aspect' => ['required', 'string', 'in:1:1,4:3,16:9,3:4,9:16'],
        ]);

        $path = PublicContentSecurity::sanitizeLenientRelativePathOrHttpUrl($validated['path'] ?? null);

        $sourceUrl = null;
        if (is_string($path) && PublicContentSecurity::isSafeHttpUrl($path)) {
            $sourceUrl = $path;
        } elseif (is_string($path) && PublicContentSecurity::isSafeRelativePath($path)) {
            $sourceUrl = rtrim((string) config('app.url'), '/').$path;
        }

        if ($sourceUrl === null) {
            throw ValidationException::withMessages([
                'path' => 'Please provide a valid public media path.',
            ]);
        }

        try {
            $result = $uploader->uploadFromUrl($sourceUrl, 'gallery-projects', (string) $validated['crop_aspect']);
        } catch (RuntimeException $exception) {
            throw ValidationException::withMessages([
                'path' => $exception->getMessage(),
            ]);
        }

        $this->recordUpload($result, 'gallery-projects', $request->user()?->id);

        return response()->json([
            'path' => $result['secure_url'],
            'url' => $result['secure_url'],
            'message' => 'Image cropped successfully.',
        ], 201);
    }

    /**
     * @param array{secure_url: string, public_id: string, format: string, bytes: int, width: int, height: int} $result
     */
    private function recordUpload(array $result, string $folder, ?int $uploadedBy): void
    {
        if ($result['public_id'] === '' || $result['secure_url'] === '') {
            return;
        }

        MediaUpload::query()->updateOrCreate(
            ['public_id' => $result['public_id']],
            [
                'secure_url' => $result['secure_url'],
                'folder' => $folder,
                'format' => $result['format'],
                'bytes' => $result['bytes'],
                'width' => $result['width'],
                'height' => $result['height'],
                'uploaded_by' => $uploadedBy,
            ]
        );
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
        $files = [...$this->listCloudinaryMediaFiles(), ...$this->listPublicMediaFiles()];

        usort($files, static fn (array $a, array $b): int => strcmp((string) $b['updated_at'], (string) $a['updated_at']));

        return [
            'files' => array_values($files),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function listCloudinaryMediaFiles(): array
    {
        if (! Schema::hasTable('media_uploads')) {
            return [];
        }

        return MediaUpload::query()
            ->latest('id')
            ->get()
            ->map(static function (MediaUpload $media): array {
                $name = basename((string) $media->public_id).'.'.$media->format;

                return [
                    'name' => $name,
                    'path' => $media->secure_url,
                    'directory' => (string) ($media->folder ?: '/'),
                    'extension' => (string) $media->format,
                    'size' => (int) $media->bytes,
                    'updated_at' => $media->updated_at?->toAtomString() ?? now()->toAtomString(),
                    'preview_url' => $media->secure_url,
                ];
            })
            ->all();
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

    private function deleteIfManagedUpload(mixed $path, ?ImageUploader $uploader = null): void
    {
        if (! is_string($path) || $path === '') {
            return;
        }

        if (str_contains($path, 'res.cloudinary.com')) {
            $uploader ??= app(ImageUploader::class);
            $publicId = $uploader->extractPublicId($path);

            if ($publicId !== null) {
                $uploader->destroy($publicId);
                MediaUpload::query()->where('public_id', $publicId)->delete();
            }

            return;
        }

        if (! str_starts_with($path, '/storage/gallery-projects/')) {
            return;
        }

        $storagePath = ltrim(substr($path, strlen('/storage/')), '/');
        if ($storagePath !== '') {
            Storage::disk('public')->delete($storagePath);
        }
    }
}
