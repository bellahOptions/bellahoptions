<?php

namespace App\Http\Controllers;

use App\Contracts\ImageUploader;
use App\Http\Requests\ProfileUpdateRequest;
use App\Models\MediaUpload;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request, ImageUploader $uploader): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        if ($request->hasFile('profile_photo')) {
            $previous = $user->profile_photo_path;

            try {
                $result = $uploader->uploadImage($request->file('profile_photo'), 'profile-photos');
            } catch (RuntimeException $exception) {
                throw ValidationException::withMessages([
                    'profile_photo' => $exception->getMessage(),
                ]);
            }

            $validated['profile_photo_path'] = $result['secure_url'];
            $this->recordUpload($result, 'profile-photos', $user->id);
            $this->deleteIfManagedUpload($previous, $uploader);
        }

        if ($request->hasFile('company_logo')) {
            $previous = $user->company_logo_path;

            try {
                $result = $uploader->uploadImage($request->file('company_logo'), 'company-logos');
            } catch (RuntimeException $exception) {
                throw ValidationException::withMessages([
                    'company_logo' => $exception->getMessage(),
                ]);
            }

            $validated['company_logo_path'] = $result['secure_url'];
            $this->recordUpload($result, 'company-logos', $user->id);
            $this->deleteIfManagedUpload($previous, $uploader);
        }

        unset($validated['profile_photo']);
        unset($validated['company_logo']);
        $validated['email'] = (string) $user->email;

        $user->fill($validated);

        $user->save();

        return Redirect::route('profile.edit');
    }

    /**
     * @param array{secure_url: string, public_id: string, format: string, bytes: int, width: int, height: int} $result
     */
    private function recordUpload(array $result, string $folder, int $uploadedBy): void
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

    private function deleteIfManagedUpload(mixed $path, ImageUploader $uploader): void
    {
        if (! is_string($path) || $path === '') {
            return;
        }

        if (str_contains($path, 'res.cloudinary.com')) {
            $publicId = $uploader->extractPublicId($path);

            if ($publicId !== null) {
                $uploader->destroy($publicId);
                MediaUpload::query()->where('public_id', $publicId)->delete();
            }

            return;
        }

        Storage::disk('public')->delete($path);
    }
}
