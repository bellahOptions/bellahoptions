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
    /** @var array<int, string> */
    private const CONTENT_MEDIA_TYPES = ['image', 'video'];

    /** @var array<int, string> */
    private const CONTENT_MEDIA_POSITIONS = ['top', 'center', 'bottom'];

    /** @var array<int, string> */
    private const LAYOUT_STYLES = ['center', 'split-left', 'split-right'];

    /** @var array<int, string> */
    private const CONTENT_ALIGNMENTS = ['left', 'center'];

    /** @var array<int, string> */
    private const ANIMATION_STYLES = ['fade-up', 'fade-down', 'slide-left', 'slide-right', 'zoom-in', 'none'];

    /** @var array<int, string> */
    private const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov'];

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
        $hasContentMediaTypeColumn = Schema::hasColumn('slide_shows', 'content_media_type');
        $hasContentMediaPathColumn = Schema::hasColumn('slide_shows', 'content_media_path');
        $hasContentMediaPositionColumn = Schema::hasColumn('slide_shows', 'content_media_position');
        $hasLayoutStyleColumn = Schema::hasColumn('slide_shows', 'layout_style');
        $hasContentAlignmentColumn = Schema::hasColumn('slide_shows', 'content_alignment');
        $hasTitleAnimationColumn = Schema::hasColumn('slide_shows', 'title_animation');
        $hasTextAnimationColumn = Schema::hasColumn('slide_shows', 'text_animation');
        $hasMediaAnimationColumn = Schema::hasColumn('slide_shows', 'media_animation');
        $hasButtonAnimationColumn = Schema::hasColumn('slide_shows', 'button_animation');

        if ($hasSlideBackgroundColumn) {
            $columns[] = 'slide_background';
        }
        if ($hasContentMediaTypeColumn) {
            $columns[] = 'content_media_type';
        }
        if ($hasContentMediaPathColumn) {
            $columns[] = 'content_media_path';
        }
        if ($hasContentMediaPositionColumn) {
            $columns[] = 'content_media_position';
        }
        if ($hasLayoutStyleColumn) {
            $columns[] = 'layout_style';
        }
        if ($hasContentAlignmentColumn) {
            $columns[] = 'content_alignment';
        }
        if ($hasTitleAnimationColumn) {
            $columns[] = 'title_animation';
        }
        if ($hasTextAnimationColumn) {
            $columns[] = 'text_animation';
        }
        if ($hasMediaAnimationColumn) {
            $columns[] = 'media_animation';
        }
        if ($hasButtonAnimationColumn) {
            $columns[] = 'button_animation';
        }

        return Inertia::render('Admin/Slides/Index', [
            'slideShows' => SlideShow::query()
                ->latest('id')
                ->get($columns)
                ->map(fn (SlideShow $slide) => [
                    'id' => $slide->id,
                    'slide_title' => $slide->slide_title,
                    'text' => $slide->text,
                    'slide_image' => $slide->slide_image,
                    'slide_background' => $hasSlideBackgroundColumn ? $slide->slide_background : null,
                    'content_media_type' => $this->normalizeContentMediaType($hasContentMediaTypeColumn ? $slide->content_media_type : null),
                    'content_media_path' => $hasContentMediaPathColumn ? $slide->content_media_path : null,
                    'content_media_position' => $this->normalizeContentMediaPosition($hasContentMediaPositionColumn ? $slide->content_media_position : null) ?? 'center',
                    'layout_style' => $this->normalizeLayoutStyle($hasLayoutStyleColumn ? $slide->layout_style : null),
                    'content_alignment' => $this->normalizeContentAlignment($hasContentAlignmentColumn ? $slide->content_alignment : null),
                    'title_animation' => $this->normalizeAnimationStyle($hasTitleAnimationColumn ? $slide->title_animation : null),
                    'text_animation' => $this->normalizeAnimationStyle($hasTextAnimationColumn ? $slide->text_animation : null),
                    'media_animation' => $this->normalizeAnimationStyle($hasMediaAnimationColumn ? $slide->media_animation : null),
                    'button_animation' => $this->normalizeAnimationStyle($hasButtonAnimationColumn ? $slide->button_animation : null),
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
                'mimetypes:image/jpeg,image/png,image/gif,image/webp,image/bmp,image/x-ms-bmp,image/svg+xml,image/avif,video/mp4,video/webm,video/ogg,video/quicktime',
                'max:51200',
            ],
        ]);

        $file = $validated['file'] ?? null;
        if (! $file instanceof UploadedFile) {
            throw ValidationException::withMessages([
                'file' => 'Please upload a valid image file.',
            ]);
        }

        $extension = strtolower($file->getClientOriginalExtension());

        if ($this->isVideoExtension($extension)) {
            $storedPath = $file->storePublicly('slide-videos', 'public');
            if (! is_string($storedPath) || $storedPath === '') {
                throw ValidationException::withMessages([
                    'file' => 'Unable to upload the selected video file.',
                ]);
            }

            $publicPath = '/storage/'.$storedPath;

            return response()->json([
                'path' => $publicPath,
                'url' => $publicPath,
                'media_type' => 'video',
                'message' => 'Video uploaded successfully.',
            ], 201);
        }

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
                'media_type' => 'image',
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
            'media_type' => 'image',
            'message' => 'Image uploaded successfully.',
        ], 201);
    }

    /**
     * @return array<string, string|null>
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
            'content_media_path' => PublicContentSecurity::sanitizeLenientRelativePathOrHttpUrl(
                $request->input('content_media_path')
            ),
            'content_media_type' => $this->normalizeContentMediaType($request->input('content_media_type')),
            'content_media_position' => $this->normalizeContentMediaPosition($request->input('content_media_position')),
            'layout_style' => $this->normalizeLayoutStyle($request->input('layout_style')),
            'content_alignment' => $this->normalizeContentAlignment($request->input('content_alignment')),
            'title_animation' => $this->normalizeAnimationStyle($request->input('title_animation')),
            'text_animation' => $this->normalizeAnimationStyle($request->input('text_animation')),
            'media_animation' => $this->normalizeAnimationStyle($request->input('media_animation')),
            'button_animation' => $this->normalizeAnimationStyle($request->input('button_animation')),
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
            'content_media_type' => ['nullable', 'string', 'in:image,video'],
            'content_media_position' => ['nullable', 'string', 'in:top,center,bottom'],
            'content_media_path' => [
                'nullable',
                'string',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value === null || $value === '' || PublicContentSecurity::isSafeRelativePathOrHttpUrl($value)) {
                        return;
                    }

                    $fail('Content media path must be a valid http(s) URL or a safe public path starting with "/".');
                },
            ],
            'layout_style' => ['nullable', 'string', 'in:center,split-left,split-right'],
            'content_alignment' => ['nullable', 'string', 'in:left,center'],
            'title_animation' => ['nullable', 'string', 'in:fade-up,fade-down,slide-left,slide-right,zoom-in,none'],
            'text_animation' => ['nullable', 'string', 'in:fade-up,fade-down,slide-left,slide-right,zoom-in,none'],
            'media_animation' => ['nullable', 'string', 'in:fade-up,fade-down,slide-left,slide-right,zoom-in,none'],
            'button_animation' => ['nullable', 'string', 'in:fade-up,fade-down,slide-left,slide-right,zoom-in,none'],
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
        $contentMediaPath = PublicContentSecurity::sanitizeLenientRelativePathOrHttpUrl($payload['content_media_path'] ?? null);
        $contentMediaType = $this->normalizeContentMediaType($payload['content_media_type'] ?? null)
            ?? $this->detectMediaTypeFromPath($contentMediaPath);

        $data = [
            'slide_title' => trim((string) $payload['slide_title']),
            'text' => trim((string) $payload['text']),
            'slide_image' => $imagePath,
            'content_media_type' => $contentMediaPath ? $contentMediaType : null,
            'content_media_path' => $contentMediaPath,
            'content_media_position' => $this->normalizeContentMediaPosition($payload['content_media_position'] ?? null) ?? 'center',
            'layout_style' => $this->normalizeLayoutStyle($payload['layout_style'] ?? null) ?? 'center',
            'content_alignment' => $this->normalizeContentAlignment($payload['content_alignment'] ?? null) ?? 'center',
            'title_animation' => $this->normalizeAnimationStyle($payload['title_animation'] ?? null) ?? 'fade-up',
            'text_animation' => $this->normalizeAnimationStyle($payload['text_animation'] ?? null) ?? 'fade-up',
            'media_animation' => $this->normalizeAnimationStyle($payload['media_animation'] ?? null) ?? 'zoom-in',
            'button_animation' => $this->normalizeAnimationStyle($payload['button_animation'] ?? null) ?? 'fade-up',
            'slide_link' => PublicContentSecurity::sanitizeLenientRelativePathOrHttpUrl($payload['slide_link'] ?? null),
            'slide_link_text' => $this->nullableTrim($payload['slide_link_text'] ?? null),
        ];

        if (Schema::hasColumn('slide_shows', 'slide_background')) {
            $data['slide_background'] = $imagePath !== '' ? null : $background;
        }
        if (! Schema::hasColumn('slide_shows', 'content_media_position')) {
            unset($data['content_media_position']);
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

        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp', 'mp4', 'webm', 'ogg', 'mov'];
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
                'media_type' => $this->isVideoExtension($extension) ? 'video' : 'image',
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

    private function normalizeContentMediaType(mixed $value): ?string
    {
        $candidate = strtolower(trim((string) $value));
        if ($candidate === '') {
            return null;
        }

        return in_array($candidate, self::CONTENT_MEDIA_TYPES, true) ? $candidate : null;
    }

    private function normalizeLayoutStyle(mixed $value): ?string
    {
        $candidate = strtolower(trim((string) $value));
        if ($candidate === '') {
            return null;
        }

        return in_array($candidate, self::LAYOUT_STYLES, true) ? $candidate : null;
    }

    private function normalizeContentMediaPosition(mixed $value): ?string
    {
        $candidate = strtolower(trim((string) $value));
        if ($candidate === '') {
            return null;
        }

        return in_array($candidate, self::CONTENT_MEDIA_POSITIONS, true) ? $candidate : null;
    }

    private function normalizeContentAlignment(mixed $value): ?string
    {
        $candidate = strtolower(trim((string) $value));
        if ($candidate === '') {
            return null;
        }

        return in_array($candidate, self::CONTENT_ALIGNMENTS, true) ? $candidate : null;
    }

    private function normalizeAnimationStyle(mixed $value): ?string
    {
        $candidate = strtolower(trim((string) $value));
        if ($candidate === '') {
            return null;
        }

        return in_array($candidate, self::ANIMATION_STYLES, true) ? $candidate : null;
    }

    private function detectMediaTypeFromPath(?string $path): ?string
    {
        if (! is_string($path) || trim($path) === '') {
            return null;
        }

        $normalizedPath = strtok($path, '?#');
        if (! is_string($normalizedPath)) {
            return null;
        }

        $extension = strtolower(pathinfo($normalizedPath, PATHINFO_EXTENSION));
        if ($extension === '') {
            return null;
        }

        return $this->isVideoExtension($extension) ? 'video' : 'image';
    }

    private function isVideoExtension(string $extension): bool
    {
        return in_array(strtolower($extension), self::VIDEO_EXTENSIONS, true);
    }
}
