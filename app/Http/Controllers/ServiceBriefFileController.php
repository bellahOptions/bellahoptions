<?php

namespace App\Http\Controllers;

use App\Models\ServiceBriefFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ServiceBriefFileController extends Controller
{
    private const MAX_FILES_PER_SESSION = 10;

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => [
                'required',
                'file',
                'max:25600',
                'mimes:jpg,jpeg,png,svg,pdf,ai,eps,psd,doc,docx,ppt,pptx,xls,xlsx,txt,zip,mp4,mov',
            ],
            'field_key' => ['required', 'string', 'max:100'],
            'upload_session_token' => ['required', 'string', 'max:64'],
        ]);

        $token = (string) $validated['upload_session_token'];

        $existingCount = ServiceBriefFile::query()->where('upload_session_token', $token)->count();

        if ($existingCount >= self::MAX_FILES_PER_SESSION) {
            return response()->json(['message' => 'You can attach up to '.self::MAX_FILES_PER_SESSION.' files per brief.'], 422);
        }

        $file = $request->file('file');
        $diskPath = $file->store("service-briefs/{$token}", 'local');

        $record = ServiceBriefFile::create([
            'upload_session_token' => $token,
            'field_key' => (string) $validated['field_key'],
            'original_filename' => (string) $file->getClientOriginalName(),
            'disk_path' => (string) $diskPath,
            'mime_type' => (string) $file->getClientMimeType(),
            'size_bytes' => (int) $file->getSize(),
        ]);

        return response()->json([
            'id' => $record->id,
            'filename' => $record->original_filename,
            'size' => $record->size_bytes,
        ]);
    }

    public function destroy(Request $request, ServiceBriefFile $serviceBriefFile): JsonResponse
    {
        $token = trim((string) $request->input('upload_session_token'));

        abort_unless(
            $serviceBriefFile->service_brief_id === null && $serviceBriefFile->upload_session_token === $token && $token !== '',
            403,
        );

        Storage::disk('local')->delete($serviceBriefFile->disk_path);
        $serviceBriefFile->delete();

        return response()->json(['deleted' => true]);
    }
}
