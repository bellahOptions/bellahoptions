<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdatePlatformSettingsRequest;
use App\Models\AppSetting;
use App\Models\Term;
use App\Support\PlatformSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class SettingController extends Controller
{
    /**
     * Platform settings: access modes, branding, contact details and the payment
     * fallback account.
     *
     * Everything else that used to render here now has its own screen (see
     * announcements(), seoMeta() and legalTerms(), plus the client reviews page on
     * ClientReviewController and the service image manager on the dashboard), so
     * those props are no longer sent to this page.
     */
    public function edit(): Response
    {
        $contactInfo = PlatformSettings::contactInfo();

        return Inertia::render('Admin/Settings', [
            'settings' => [
                'maintenance_mode' => AppSetting::getBool('maintenance_mode'),
                'website_uri' => PlatformSettings::siteUrl(),
                'contact_phone' => $contactInfo['phone'],
                'contact_email' => $contactInfo['email'],
                'contact_location' => $contactInfo['location'],
                'contact_whatsapp_url' => $contactInfo['whatsapp_url'],
                'contact_behance_url' => $contactInfo['behance_url'],
                'contact_map_embed_url' => $contactInfo['map_embed_url'],
                'logo_path' => PlatformSettings::brandAssets()['logo_path'],
                'favicon_path' => PlatformSettings::brandAssets()['favicon_path'],
                'payment_fallback' => PlatformSettings::paymentFallback(),
            ],
        ]);
    }

    /**
     * Service announcement modal. Previously a section inside Platform Settings.
     */
    public function announcements(): Response
    {
        return Inertia::render('Admin/Announcements', [
            'settings' => [
                'service_announcement' => PlatformSettings::serviceAnnouncement(),
            ],
        ]);
    }

    /**
     * Public SEO metadata. Previously a section inside Platform Settings.
     */
    public function seoMeta(): Response
    {
        return Inertia::render('Admin/SeoMeta', [
            'settings' => [
                'public_seo' => PlatformSettings::publicSeoSettings(),
            ],
        ]);
    }

    /**
     * Legal terms manager. Previously a section inside Platform Settings.
     */
    public function legalTerms(): Response
    {
        return Inertia::render('Admin/LegalTerms', [
            'settings' => [
                'terms' => $this->policyTermsPayload(),
            ],
        ]);
    }

    public function update(UpdatePlatformSettingsRequest $request): RedirectResponse|JsonResponse
    {
        $payload = $request->validated();

        if (array_key_exists('maintenance_mode', $payload)) {
            AppSetting::setBool('maintenance_mode', (bool) $payload['maintenance_mode']);
        }

        if (array_key_exists('website_uri', $payload)) {
            PlatformSettings::setSiteUrl((string) $payload['website_uri']);
        }

        $contactKeys = [
            'contact_phone' => 'phone',
            'contact_email' => 'email',
            'contact_location' => 'location',
            'contact_whatsapp_url' => 'whatsapp_url',
            'contact_behance_url' => 'behance_url',
            'contact_map_embed_url' => 'map_embed_url',
        ];
        $hasContactUpdate = false;
        foreach (array_keys($contactKeys) as $key) {
            if (array_key_exists($key, $payload)) {
                $hasContactUpdate = true;
                break;
            }
        }
        if ($hasContactUpdate) {
            $contactInfo = PlatformSettings::contactInfo();
            foreach ($contactKeys as $requestKey => $settingKey) {
                if (array_key_exists($requestKey, $payload)) {
                    $contactInfo[$settingKey] = (string) $payload[$requestKey];
                }
            }
            PlatformSettings::setContactInfo($contactInfo);
        }

        if (array_key_exists('logo_path', $payload) || array_key_exists('favicon_path', $payload)) {
            $brandAssets = PlatformSettings::brandAssets();
            if (array_key_exists('logo_path', $payload)) {
                $brandAssets['logo_path'] = (string) $payload['logo_path'];
            }
            if (array_key_exists('favicon_path', $payload)) {
                $brandAssets['favicon_path'] = (string) $payload['favicon_path'];
            }
            PlatformSettings::setBrandAssets($brandAssets);
        }

        if (array_key_exists('public_seo', $payload) && is_array($payload['public_seo'])) {
            PlatformSettings::setPublicSeoSettings($payload['public_seo']);
        }

        if (array_key_exists('payment_fallback', $payload) && is_array($payload['payment_fallback'])) {
            // partial update: setPaymentFallback() only writes the keys it is
            // given, so an auto-save of one field cannot wipe the rest.
            PlatformSettings::setPaymentFallback($payload['payment_fallback']);
        }

        if (array_key_exists('service_announcement', $payload) && is_array($payload['service_announcement'])) {
            PlatformSettings::setServiceAnnouncement($payload['service_announcement']);
        }

        if (array_key_exists('service_images', $payload) && is_array($payload['service_images'])) {
            // Partial update, keyed by service slug (or `announcement`).
            PlatformSettings::setServiceImages($payload['service_images']);
        }

        if (is_array($payload['terms'] ?? null)) {
            $this->savePolicyTerms((array) $payload['terms']);
        }

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Platform settings updated successfully.',
            ]);
        }

        return back()->with('success', 'Platform settings updated successfully.');
    }

    /**
     * @return array{terms_of_service: string, privacy_policy: string, cookie_policy: string}
     */
    private function policyTermsPayload(): array
    {
        return [
            'terms_of_service' => $this->findPolicyContentByKeyword('terms'),
            'privacy_policy' => $this->findPolicyContentByKeyword('privacy'),
            'cookie_policy' => $this->findPolicyContentByKeyword('cookie'),
        ];
    }

    private function findPolicyContentByKeyword(string $keyword): string
    {
        if (! $this->termsTableExists()) {
            return '';
        }

        $term = Term::query()
            ->whereRaw('LOWER(title) LIKE ?', ['%'.strtolower($keyword).'%'])
            ->latest('updated_at')
            ->first();

        return $term instanceof Term ? (string) $term->content : '';
    }

    /**
     * @param  array<string, mixed>  $termsPayload
     */
    private function savePolicyTerms(array $termsPayload): void
    {
        if (! $this->termsTableExists()) {
            return;
        }

        $map = [
            'terms_of_service' => 'Terms of Service',
            'privacy_policy' => 'Privacy Policy',
            'cookie_policy' => 'Cookie Policy',
        ];

        foreach ($map as $field => $title) {
            $content = trim((string) ($termsPayload[$field] ?? ''));

            Term::query()->updateOrCreate(
                ['title' => $title],
                ['content' => $content],
            );
        }
    }

    private function termsTableExists(): bool
    {
        try {
            return Schema::hasTable('terms');
        } catch (Throwable $exception) {
            Log::warning('Unable to confirm terms table availability.', [
                'message' => $exception->getMessage(),
            ]);

            return false;
        }
    }

}
