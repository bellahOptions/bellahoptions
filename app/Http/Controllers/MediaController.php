<?php

namespace App\Http\Controllers;

use App\Support\ImageEngine;
use App\Support\MediaPath;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Serves local media with immutable caching.
 *
 * Deliberately route-served rather than symlink-served: shared hosting often
 * cannot follow a `public/storage` symlink, which is one of the reasons uploads
 * appeared to work but never displayed. A stored file is immutable (its name is a
 * content digest), so it can be cached for a year with `immutable`, which is what
 * actually makes repeat views fast.
 */
class MediaController extends Controller
{
    public function show(Request $request, string $folder, string $name): Response
    {
        if (! MediaPath::isValidFolder($folder) || ! MediaPath::isValidFileName($name)) {
            abort(404);
        }

        $path = MediaPath::storagePath($folder, $name);
        $disk = Storage::disk(ImageEngine::DISK);

        if (! $disk->exists($path)) {
            abort(404);
        }

        $extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        $mime = app(ImageEngine::class)->mimeFor($extension);
        $lastModified = $disk->lastModified($path);
        $etag = '"'.substr(sha1($path.'|'.$lastModified.'|'.$disk->size($path)), 0, 32).'"';

        $headers = [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=31536000, immutable',
            'ETag' => $etag,
            'X-Content-Type-Options' => 'nosniff',
            'Last-Modified' => gmdate('D, d M Y H:i:s', $lastModified).' GMT',
        ];

        // A stored image never changes, so a matching validator means the browser
        // can reuse what it already has without us sending the bytes again.
        if (trim((string) $request->header('If-None-Match')) === $etag) {
            return response('', 304, $headers);
        }

        $absolutePath = $disk->path($path);

        return new BinaryFileResponse($absolutePath, 200, $headers, true, null, false);
    }
}
