<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $visitorLocalization = (array) $request->attributes->get('visitor_localization', []);

        return [
            ...parent::share($request),
            'localization' => [
                'country_code' => (string) ($visitorLocalization['country_code'] ?? 'NG'),
                'country' => (string) ($visitorLocalization['country'] ?? 'Nigeria'),
                'locale' => (string) ($visitorLocalization['locale'] ?? 'en_NG'),
                'language' => (string) ($visitorLocalization['language'] ?? 'en'),
                'currency' => (string) ($visitorLocalization['currency'] ?? 'NGN'),
                'payment_processor' => (string) ($visitorLocalization['payment_processor'] ?? 'paystack'),
            ],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'address' => $user->address,
                    'is_staff' => $user->isStaff(),
                    'is_super_admin' => $user->isSuperAdmin(),
                    'can_manage_invoices' => $user->canManageInvoices(),
                    'can_manage_settings' => $user->canManageSettings(),
                    'can_manage_slides' => $user->canManageSlides(),
                    'can_manage_public_content' => $user->canManagePublicContent(),
                    'can_manage_users' => $user->canManageUsers(),
                    'can_manage_waitlist' => $user->canManageWaitlist(),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
