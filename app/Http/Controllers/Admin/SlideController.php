<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SlideShow;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SlideController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('Admin/Slides/Index', [
            'slideShows' => SlideShow::query()
                ->latest('id')
                ->get(['id', 'slide_title', 'text', 'slide_image', 'slide_link', 'slide_link_text', 'created_at', 'updated_at']),
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

    /**
     * @return array{slide_title: string, text: string, slide_image: string, slide_link: string|null, slide_link_text: string|null}
     */
    private function validatedPayload(Request $request): array
    {
        $payload = $request->validate([
            'slide_title' => ['required', 'string', 'max:120'],
            'text' => ['required', 'string', 'max:260'],
            'slide_image' => ['required', 'string', 'max:255'],
            'slide_link' => ['nullable', 'string', 'max:255', "regex:/^(https?:\/\/|\/).+/i"],
            'slide_link_text' => ['nullable', 'string', 'max:60'],
        ], [
            'slide_link.regex' => 'Slide link must start with "https://", "http://", or "/".',
        ]);

        return [
            'slide_title' => trim((string) $payload['slide_title']),
            'text' => trim((string) $payload['text']),
            'slide_image' => trim((string) $payload['slide_image']),
            'slide_link' => $this->nullableTrim($payload['slide_link'] ?? null),
            'slide_link_text' => $this->nullableTrim($payload['slide_link_text'] ?? null),
        ];
    }

    private function nullableTrim(mixed $value): ?string
    {
        $trimmed = trim((string) $value);

        return $trimmed !== '' ? $trimmed : null;
    }
}
