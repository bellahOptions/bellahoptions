<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SlideShow;
use App\Support\PublicContentSecurity;
use App\Support\SlideBackgroundOptions;
use App\Support\WebpImageConverter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SlideController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        if (! Schema::hasTable('slide_shows')) {
            return Inertia::render('Admin/Slides/Index', [
                'slideShows' => [],
                'mediaLibrary' => $this->mediaLibraryPayload(),
            ]);
        }

        $columns = ['id', 'slide_title', 'text', 'slide_image', 'slide_link', 'slide_link_text', 'created_at', 'updated_at'];
        $hasSlideBackgroundColumn = Schema::hasColumn('slide_shows', 'slide_background');

        if ($hasSlideBackgroundColumn) {
            $columns[] = 'slide_background';
        }

        return Inertia::render('Admin/Slides/Index', [
            'slideShows' => SlideShow::query()
                ->latest('id')
                ->get($columns)
                ->map(static fn (SlideShow $slide) => [
                    'id' => $slide->id,
                    'slide_title' => $slide->slide_title,
                    'text' => $slide->text,
                    'slide_image' => $slide->slide_image,
                    'slide_background' => $hasSlideBackgroundColumn ? $slide->slide_background : null,
                    'slide_link' => $slide->slide_link,
                    'slide_link_text' => $slide->slide_link_text,
                    'created_at' => $slide->created_at,
                    'updated_at' => $slide->updated_at,
                ])
                ->values(),
            'mediaLibrary' => $this->mediaLibraryPayload(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        if (! Schema::hasTable('slide_shows')) {
            return back()->with('error', 'Slide storage table is missing. Run migrations and try again.');
        }

        SlideShow::create($this->validatedPayload($request));

        return back()->with('success', 'Slide created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(SlideShow $slideShow)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(SlideShow $slideShow)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, SlideShow $slide): RedirectResponse
    {
        $slide->update($this->validatedPayload($request));

        return back()->with('success', 'Slide updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SlideShow $slide): RedirectResponse
    {
        $slide->delete();

        return back()->with('success', 'Slide deleted successfully.');
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
            $storedPath = $file->storePublicly('slide-images', 'public');
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
            $storedPath = $converter->storePublicWebp($file, 'slide-images');
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
     * @return array{slide_title: string, text: string, slide_image: string, slide_link: string|null, slide_link_text: string|null, slide_background?: string|null}
     */
    private function validatedPayload(Request $request): array
    {
        $request->merge([
            'slide_image' => PublicContentSecurity::sanitizeLenientRelativePathOrHttpUrl(
                $request->input('slide_image')
            ),
            'slide_link' => PublicContentSecurity::sanitizeLenientRelativePathOrHttpUrl(
                $request->input('slide_link')
            ),
            'slide_background' => SlideBackgroundOptions::sanitize($request->input('slide_background')),
        ]);

        $payload = $request->validate([
            'slide_title' => ['required', 'string', 'max:120'],
            'text' => ['required', 'string', 'max:260'],
            'slide_image' => [
                'nullable',
                'string',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value === null || $value === '' || PublicContentSecurity::isSafeRelativePathOrHttpUrl($value)) {
                        return;
                    }

                    $fail('Slide image must be a valid http(s) URL or a safe public path starting with "/".');
                },
            ],
            'slide_background' => [
                'nullable',
                'string',
                'max:80',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value === null || SlideBackgroundOptions::sanitize($value) !== null) {
                        return;
                    }

                    $fail('Slide background selection is invalid.');
                },
            ],
            'slide_link' => [
                'nullable',
                'string',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value === null || PublicContentSecurity::isSafeRelativePathOrHttpUrl($value)) {
                        return;
                    }

                    $fail('Slide link must be a valid http(s) URL or a safe path starting with "/".');
                },
            ],
            'slide_link_text' => ['nullable', 'string', 'max:60'],
        ]);

        $imagePath = (string) (PublicContentSecurity::sanitizeLenientRelativePathOrHttpUrl($payload['slide_image'] ?? null) ?? '');
        $background = SlideBackgroundOptions::sanitize($payload['slide_background'] ?? null);

        $data = [
            'slide_title' => trim((string) $payload['slide_title']),
            'text' => trim((string) $payload['text']),
            'slide_image' => $imagePath,
            'slide_link' => PublicContentSecurity::sanitizeLenientRelativePathOrHttpUrl($payload['slide_link'] ?? null),
            'slide_link_text' => $this->nullableTrim($payload['slide_link_text'] ?? null),
        ];

        if (Schema::hasColumn('slide_shows', 'slide_background')) {
            $data['slide_background'] = $imagePath !== '' ? null : $background;
        }

        return $data;
    }

    /**
     * @return array{files: array<int, array<string, mixed>>, dynamic_backgrounds: array<int, array{id: string, label: string, description: string}>}
     */
    private function mediaLibraryPayload(): array
    {
        return [
            'files' => $this->listPublicMediaFiles(),
            'dynamic_backgrounds' => SlideBackgroundOptions::all(),
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

    private function nullableTrim(mixed $value): ?string
    {
        $trimmed = trim((string) $value);

        return $trimmed !== '' ? $trimmed : null;
    }
}
