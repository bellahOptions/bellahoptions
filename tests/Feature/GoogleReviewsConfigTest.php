<?php

namespace Tests\Feature;

use App\Models\AppSetting;
use App\Support\PlatformSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GoogleReviewsConfigTest extends TestCase
{
    use RefreshDatabase;

    public function test_google_reviews_place_id_defaults_when_setting_is_missing(): void
    {
        $config = PlatformSettings::googleReviewsConfig();

        $this->assertSame('ChIJlTRzKhGNOxAR2XWyE91sBNs', $config['place_id']);
    }

    public function test_google_reviews_place_id_falls_back_to_default_when_saved_value_is_empty(): void
    {
        AppSetting::setValue('google_reviews_config_json', json_encode([
            'place_id' => '',
            'featured_review_ids' => [],
        ], JSON_UNESCAPED_SLASHES));

        $config = PlatformSettings::googleReviewsConfig();

        $this->assertSame('ChIJlTRzKhGNOxAR2XWyE91sBNs', $config['place_id']);
    }
}
