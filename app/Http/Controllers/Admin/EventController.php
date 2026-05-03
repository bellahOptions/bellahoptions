<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Support\PublicContentSecurity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Events/Index', [
            'items' => Event::query()
                ->orderByRaw('event_date is null')
                ->orderBy('event_date')
                ->orderBy('position')
                ->latest('id')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Event::query()->create([
            ...$this->validatedData($request),
            'uploaded_by' => $request->user()?->id,
        ]);

        return back()->with('success', 'Event added.');
    }

    public function update(Request $request, Event $event): RedirectResponse
    {
        $event->update($this->validatedData($request));

        return back()->with('success', 'Event updated.');
    }

    public function destroy(Event $event): RedirectResponse
    {
        $event->delete();

        return back()->with('success', 'Event deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedData(Request $request): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string'],
            'event_date' => ['nullable', 'date'],
            'location' => ['nullable', 'string', 'max:180'],
            'image_path' => [
                'nullable',
                'string',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value === null || PublicContentSecurity::isSafeRelativePathOrHttpUrl($value)) {
                        return;
                    }

                    $fail('Image path must be a valid http(s) URL or a safe public path starting with "/".');
                },
            ],
            'registration_url' => [
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
            'description' => PublicContentSecurity::normalizeNullableText($data['description'] ?? null),
            'location' => PublicContentSecurity::normalizeNullableText($data['location'] ?? null),
            'image_path' => PublicContentSecurity::sanitizeRelativePathOrHttpUrl($data['image_path'] ?? null),
            'registration_url' => PublicContentSecurity::normalizeNullableText($data['registration_url'] ?? null),
            'position' => (int) ($data['position'] ?? 0),
        ];
    }
}
