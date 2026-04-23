<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdatePlatformSettingsRequest;
use App\Models\AppSetting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('Admin/Settings', [
            'settings' => [
                'maintenance_mode' => AppSetting::getBool('maintenance_mode'),
                'coming_soon_mode' => AppSetting::getBool('coming_soon_mode'),
            ],
        ]);
    }

    public function update(UpdatePlatformSettingsRequest $request): RedirectResponse
    {
        AppSetting::setBool('maintenance_mode', $request->boolean('maintenance_mode'));
        AppSetting::setBool('coming_soon_mode', $request->boolean('coming_soon_mode'));

        return back()->with('success', 'Platform settings updated successfully.');
    }
}
