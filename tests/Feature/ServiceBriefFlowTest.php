<?php

namespace Tests\Feature;

use App\Mail\ServiceBriefAdminAlertMail;
use App\Mail\ServiceBriefReceivedMail;
use App\Models\ServiceBrief;
use App\Models\ServiceBriefTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ServiceBriefFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        config()->set('bellah.invoice.admin_notification_emails', ['ops@bellahoptions.com']);
        $this->seed(\Database\Seeders\ServiceBriefTemplateSeeder::class);
    }

    /**
     * @return array<string, mixed>
     */
    private function passHumanCheck(string $serviceSlug): array
    {
        $this->get(route('brief.create', $serviceSlug));

        $guard = session('brief_human_check');
        $guard['issued_at'] = now()->subSeconds(8)->timestamp;
        session(['brief_human_check' => $guard]);

        return [
            'human_check_answer' => $guard['answer'],
            'human_check_nonce' => $guard['nonce'],
            'form_rendered_at' => $guard['issued_at'],
            'website_confirm' => '',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function baseUniversalAnswers(): array
    {
        return [
            'client_name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
            'phone' => '+2348108671804',
            'contact_pref' => 'WhatsApp',
            'location' => 'Lagos',
            'industry' => 'Technology / Software',
            'brand_stage' => 'Existing, staying as it is',
            'timeline' => 'Within 1 week',
            // "Not sure" is present in every service's budget scale (config/service_briefs.php),
            // so this stays valid regardless of which service a test submits against.
            'budget_range' => 'Not sure – advise me',
            'consent_ndpa' => true,
        ];
    }

    public function test_client_can_submit_a_web_design_brief_end_to_end(): void
    {
        $answers = array_merge($this->baseUniversalAnswers(), [
            'wd_type' => 'Business / corporate website',
            'wd_page_count' => '2-5 pages',
            'wd_build_type' => 'Custom-coded (Laravel + React)',
            'wd_primary_goal' => 'Contact / enquire',
            'wd_features' => ['Contact form'],
            'wd_legal_pages' => 'Not sure',
            'wd_content_source' => "I'll supply everything",
            'wd_image_source' => "I'll supply my own",
            'wd_has_brand' => 'Nothing yet',
            'wd_references' => 'I like the layout of stripe.com and linear.app for their clarity.',
            'wd_domain_status' => "I'm not sure",
            'wd_hosting_status' => 'Not sure what that means',
            'wd_seo' => 'Explain this to me first',
            'wd_maintenance' => 'Not decided yet',
        ]);

        $payload = array_merge($this->passHumanCheck('web-design'), ['answers' => $answers]);

        $response = $this->post(route('brief.store', 'web-design'), $payload);

        $brief = ServiceBrief::query()->first();

        $this->assertNotNull($brief);
        $response->assertRedirect(route('brief.confirmation', ['serviceSlug' => 'web-design', 'referenceNumber' => $brief->reference_number]));

        $this->assertMatchesRegularExpression('/^BO-WD-\d{6}-0001$/', $brief->reference_number);
        $this->assertSame('new', $brief->status);
        $this->assertFalse($brief->is_rush);
        $this->assertSame('ada@example.com', $brief->customer_email);
        $this->assertSame('web-design', $brief->service_slug);

        Mail::assertSent(ServiceBriefReceivedMail::class, fn (ServiceBriefReceivedMail $mail): bool => $mail->hasTo('ada@example.com'));
        Mail::assertSent(ServiceBriefAdminAlertMail::class, fn (ServiceBriefAdminAlertMail $mail): bool => $mail->hasTo('ops@bellahoptions.com'));
    }

    public function test_conditional_field_is_required_only_when_its_condition_is_met(): void
    {
        $answers = array_merge($this->baseUniversalAnswers(), [
            'wd_type' => 'Redesign of an existing site',
            'wd_page_count' => '2-5 pages',
            'wd_build_type' => 'Custom-coded (Laravel + React)',
            'wd_primary_goal' => 'Contact / enquire',
            'wd_features' => ['Contact form'],
            'wd_legal_pages' => 'Not sure',
            'wd_content_source' => "I'll supply everything",
            'wd_image_source' => "I'll supply my own",
            'wd_has_brand' => 'Nothing yet',
            'wd_references' => 'I like the layout of stripe.com and linear.app for their clarity.',
            'wd_domain_status' => "I'm not sure",
            'wd_hosting_status' => 'Not sure what that means',
            'wd_seo' => 'Explain this to me first',
            'wd_maintenance' => 'Not decided yet',
            // wd_existing_url / wd_existing_issues intentionally omitted, but required for "Redesign".
        ]);

        $payload = array_merge($this->passHumanCheck('web-design'), ['answers' => $answers]);

        $this->post(route('brief.store', 'web-design'), $payload)
            ->assertSessionHasErrors(['answers.wd_existing_url', 'answers.wd_existing_issues']);

        $this->assertSame(0, ServiceBrief::query()->count());
    }

    public function test_rush_timeline_sets_is_rush_flag(): void
    {
        $answers = array_merge($this->baseUniversalAnswers(), ['timeline' => 'Rush – within 48 hours']);
        $payload = array_merge($this->passHumanCheck('manage-hires'), ['answers' => $answers]);

        $this->post(route('brief.store', 'manage-hires'), $payload)->assertSessionDoesntHaveErrors();

        $brief = ServiceBrief::query()->first();
        $this->assertNotNull($brief);
        $this->assertTrue($brief->is_rush);
    }

    public function test_nda_answer_sets_nda_required_flag(): void
    {
        $answers = array_merge($this->baseUniversalAnswers(), [
            'ux_product_type' => 'Mobile app',
            'ux_stage' => 'Idea / discovery – nothing built yet',
            'ux_summary' => 'A marketplace app connecting local artisans with customers nearby.',
            'ux_scope' => ['Wireframes (low fidelity)'],
            'ux_screen_count' => '6-15',
            'ux_tool' => 'Figma (our default)',
            'ux_handover' => 'No',
            'ux_users' => 'Local artisans and their customers, mostly on Android phones.',
            'ux_user_savvy' => 'Average',
            'ux_devices' => ['Android phone'],
            'ux_core_problem' => 'There is no easy way for artisans to showcase their work online.',
            'ux_has_data' => 'No',
            'ux_success_metric' => ['More signups'],
            'ux_has_brand' => 'Nothing – design is open',
            'ux_dev_team' => 'Not decided',
            'ux_accessibility' => 'Standard good practice is fine',
            'ux_references' => 'Airbnb and Etsy for their clean marketplace browsing experience.',
            'ux_nda' => 'Yes',
        ]);

        $payload = array_merge($this->passHumanCheck('ui-ux'), ['answers' => $answers]);

        $this->post(route('brief.store', 'ui-ux'), $payload)->assertSessionDoesntHaveErrors();

        $brief = ServiceBrief::query()->first();
        $this->assertNotNull($brief);
        $this->assertTrue($brief->nda_required);
    }

    public function test_submission_without_ndpa_consent_is_rejected(): void
    {
        $answers = array_merge($this->baseUniversalAnswers(), ['consent_ndpa' => false]);
        $payload = array_merge($this->passHumanCheck('manage-hires'), ['answers' => $answers]);

        $this->post(route('brief.store', 'manage-hires'), $payload)
            ->assertSessionHasErrors(['answers.consent_ndpa']);

        $this->assertSame(0, ServiceBrief::query()->count());
    }

    public function test_reference_numbers_are_sequential_per_service_and_month(): void
    {
        foreach ([1, 2] as $i) {
            $answers = array_merge($this->baseUniversalAnswers(), ['email' => "client{$i}@example.com"]);
            $payload = array_merge($this->passHumanCheck('manage-hires'), ['answers' => $answers]);
            $this->post(route('brief.store', 'manage-hires'), $payload)->assertSessionDoesntHaveErrors();
        }

        $references = ServiceBrief::query()->orderBy('id')->pluck('reference_number')->all();

        $this->assertCount(2, $references);
        $this->assertStringEndsWith('-0001', $references[0]);
        $this->assertStringEndsWith('-0002', $references[1]);
    }

    public function test_honeypot_field_causes_validation_to_fail(): void
    {
        $answers = $this->baseUniversalAnswers();
        $payload = array_merge($this->passHumanCheck('manage-hires'), ['answers' => $answers, 'website_confirm' => 'http://spam.example']);

        $this->post(route('brief.store', 'manage-hires'), $payload)
            ->assertSessionHasErrors('website_confirm');

        $this->assertSame(0, ServiceBrief::query()->count());
    }

    public function test_uploaded_file_is_attached_to_the_brief_on_submit(): void
    {
        $uploadToken = 'test-session-token-123';

        $uploadResponse = $this->post(route('brief-files.store'), [
            'file' => UploadedFile::fake()->create('logo.png', 100, 'image/png'),
            'field_key' => 'sm_brand_files',
            'upload_session_token' => $uploadToken,
        ]);

        $uploadResponse->assertOk();
        $fileId = $uploadResponse->json('id');
        $this->assertNotNull($fileId);

        $answers = array_merge($this->baseUniversalAnswers(), [
            'sm_platforms' => ['Instagram'],
            'sm_formats' => ['Single feed posts'],
            'sm_quantity' => 'Not sure, advise me',
            'sm_engagement_type' => 'One-off batch',
            'sm_goal' => ['Brand awareness'],
            'sm_message' => 'We want to promote our new skincare line with vibrant, clean visuals.',
            'sm_copy_status' => 'No – please write it for me',
            'sm_language' => 'English',
            'sm_has_brand' => 'Logo only',
            'sm_brand_files' => [$fileId],
            'sm_has_images' => 'No – use stock images',
            'sm_style' => 'Clean & minimal',
            'sm_source_files' => 'No',
        ]);

        $payload = array_merge($this->passHumanCheck('social-media-design'), ['answers' => $answers, 'upload_session_token' => $uploadToken]);

        $this->post(route('brief.store', 'social-media-design'), $payload)->assertSessionDoesntHaveErrors();

        $brief = ServiceBrief::query()->first();
        $this->assertNotNull($brief);
        $this->assertSame(1, $brief->files()->count());
    }

    public function test_staff_can_view_and_transition_brief_status(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);

        $template = ServiceBriefTemplate::query()->where('service_slug', 'manage-hires')->first();
        $brief = ServiceBrief::create([
            'reference_number' => 'BO-MH-202609-0001',
            'service_brief_template_id' => $template?->id,
            'service_slug' => 'manage-hires',
            'status' => ServiceBrief::STATUS_NEW,
            'answers' => ['client_name' => 'Test Client', 'email' => 'client@example.com'],
            'customer_name' => 'Test Client',
            'customer_email' => 'client@example.com',
        ]);

        $this->actingAs($staff)
            ->get(route('admin.service-briefs.show', $brief->uuid))
            ->assertOk();

        $this->actingAs($staff)
            ->patch(route('admin.service-briefs.status', $brief->uuid), ['status' => 'reviewing'])
            ->assertSessionHas('success');

        $this->assertSame('reviewing', $brief->fresh()->status);
    }

    public function test_only_super_admin_can_manage_brief_templates(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $payload = [
            'service_slug' => 'manage-hires',
            'name' => 'Manage Hires Brief',
            'intro_copy' => 'Tell us about the role.',
            'estimated_minutes' => 3,
            'steps' => [
                ['title' => 'Role Details', 'fields' => [
                    ['key' => 'mh_role_title', 'label' => 'What role do you need filled?', 'type' => 'text', 'required' => true],
                ]],
            ],
        ];

        $this->actingAs($staff)
            ->post(route('admin.service-brief-templates.store'), $payload)
            ->assertForbidden();

        $this->actingAs($superAdmin)
            ->post(route('admin.service-brief-templates.store'), $payload)
            ->assertSessionHas('success');

        // manage-hires has no seeded template, so this is the first version created.
        $this->assertSame(
            1,
            ServiceBriefTemplate::query()->where('service_slug', 'manage-hires')->count(),
        );
        $this->assertSame(
            1,
            ServiceBriefTemplate::query()->where('service_slug', 'manage-hires')->where('is_active', true)->count(),
        );
    }
}
