<?php

namespace Tests\Feature;

use App\Mail\QuestionnaireRequestMail;
use App\Models\Invoice;
use App\Models\Questionnaire;
use App\Models\QuestionnaireTemplate;
use App\Models\ServiceOrder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class QuestionnaireFlowTest extends TestCase
{
    use RefreshDatabase;

    private function createWhatsappPaidInvoiceWithServiceOrder(string $customerEmail = 'client@example.com'): Invoice
    {
        $staff = User::factory()->create(['role' => 'staff']);

        $invoice = Invoice::create([
            'invoice_number' => 'INV-QSTN-'.Str::random(4),
            'customer_name' => 'Questionnaire Client',
            'customer_email' => $customerEmail,
            'title' => 'Web Design Project',
            'amount' => 90000,
            'currency' => 'NGN',
            'status' => 'paid',
            'payment_method' => 'whatsapp',
            'paid_at' => now(),
            'issued_at' => now(),
            'created_by' => $staff->id,
        ]);

        ServiceOrder::create([
            'uuid' => (string) Str::uuid(),
            'order_code' => 'BOQSTN'.Str::random(3),
            'invoice_id' => $invoice->id,
            'service_slug' => 'web-design',
            'service_name' => 'Web Design',
            'package_code' => 'starter',
            'package_name' => 'Starter',
            'currency' => 'NGN',
            'amount' => 90000,
            'payment_status' => 'paid',
            'order_status' => 'in_progress',
            'progress_percent' => 60,
            'full_name' => 'Questionnaire Client',
            'email' => $customerEmail,
            'business_name' => 'Client Co',
            'project_summary' => 'Website redesign',
        ]);

        return $invoice->fresh();
    }

    public function test_staff_can_send_questionnaire_for_whatsapp_paid_invoice_with_template(): void
    {
        Mail::fake();

        QuestionnaireTemplate::create([
            'service_slug' => 'web-design',
            'name' => 'Web Design Questionnaire',
            'questions' => [
                ['id' => 'q1', 'label' => 'How satisfied were you?', 'type' => 'rating', 'options' => []],
            ],
            'is_active' => true,
        ]);

        $invoice = $this->createWhatsappPaidInvoiceWithServiceOrder();
        $staff = User::factory()->create(['role' => 'staff']);

        $this->actingAs($staff)
            ->post(route('admin.invoices.send-questionnaire', $invoice))
            ->assertSessionHas('success');

        $questionnaire = Questionnaire::query()->where('invoice_id', $invoice->id)->first();

        $this->assertNotNull($questionnaire);
        $this->assertSame('pending', $questionnaire->status);
        $this->assertNotNull($questionnaire->requested_at);

        Mail::assertSent(QuestionnaireRequestMail::class, function (QuestionnaireRequestMail $mail): bool {
            return $mail->hasTo('client@example.com');
        });
    }

    public function test_questionnaire_cannot_be_sent_without_a_template(): void
    {
        Mail::fake();

        $invoice = $this->createWhatsappPaidInvoiceWithServiceOrder();
        $staff = User::factory()->create(['role' => 'staff']);

        $this->actingAs($staff)
            ->post(route('admin.invoices.send-questionnaire', $invoice))
            ->assertSessionHas('error');

        $this->assertSame(0, Questionnaire::query()->where('invoice_id', $invoice->id)->count());
        Mail::assertNothingSent();
    }

    public function test_questionnaire_cannot_be_sent_for_non_whatsapp_payment(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);

        $invoice = Invoice::create([
            'invoice_number' => 'INV-QSTN-CARD',
            'customer_name' => 'Card Client',
            'customer_email' => 'card-client@example.com',
            'title' => 'Web Design Project',
            'amount' => 90000,
            'currency' => 'NGN',
            'status' => 'paid',
            'payment_method' => 'paystack',
            'paid_at' => now(),
            'issued_at' => now(),
            'created_by' => $staff->id,
        ]);

        $this->actingAs($staff)
            ->post(route('admin.invoices.send-questionnaire', $invoice))
            ->assertSessionHas('error');
    }

    public function test_only_super_admin_can_manage_questionnaire_templates(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $payload = [
            'service_slug' => 'web-design',
            'name' => 'Web Design Questionnaire',
            'questions' => [
                ['id' => 'q1', 'label' => 'How satisfied were you?', 'type' => 'rating', 'options' => []],
            ],
            'is_active' => true,
        ];

        $this->actingAs($staff)
            ->post(route('admin.questionnaire-templates.store'), $payload)
            ->assertForbidden();

        $this->actingAs($superAdmin)
            ->post(route('admin.questionnaire-templates.store'), $payload)
            ->assertSessionHas('success');

        $this->assertSame(1, QuestionnaireTemplate::query()->where('service_slug', 'web-design')->count());
    }

    public function test_super_admin_can_import_questions_from_csv(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $csv = "question,type,options\nHow satisfied were you?,rating,\nHow did you hear about us?,choice,Instagram;Referral\n";
        $file = \Illuminate\Http\UploadedFile::fake()->createWithContent('questions.csv', $csv);

        $response = $this->actingAs($superAdmin)
            ->post(route('admin.questionnaire-templates.import'), ['file' => $file]);

        $response->assertOk();
        $response->assertJsonCount(2, 'questions');
        $this->assertSame('How satisfied were you?', $response->json('questions.0.label'));
        $this->assertSame('rating', $response->json('questions.0.type'));
        $this->assertSame(['Instagram', 'Referral'], $response->json('questions.1.options'));
    }

    public function test_staff_cannot_import_questionnaire_questions(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $file = \Illuminate\Http\UploadedFile::fake()->createWithContent('questions.csv', "question,type\nHow was it?,text\n");

        $this->actingAs($staff)
            ->post(route('admin.questionnaire-templates.import'), ['file' => $file])
            ->assertForbidden();
    }

    public function test_importing_an_empty_csv_returns_a_validation_error(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $file = \Illuminate\Http\UploadedFile::fake()->createWithContent('empty.csv', '');

        $response = $this->actingAs($superAdmin)
            ->post(route('admin.questionnaire-templates.import'), ['file' => $file]);

        $response->assertStatus(422);
        $this->assertNotNull($response->json('message'));
    }

    public function test_super_admin_can_import_questions_from_a_generated_pdf(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $html = '<p>Service Questionnaire</p><p>How satisfied were you with the final delivery?</p><p>Any other comments?</p>';
        $dompdf = new \Dompdf\Dompdf();
        $dompdf->loadHtml($html);
        $dompdf->render();

        $file = \Illuminate\Http\UploadedFile::fake()->createWithContent('questions.pdf', $dompdf->output());

        $response = $this->actingAs($superAdmin)
            ->post(route('admin.questionnaire-templates.import'), ['file' => $file]);

        $response->assertOk();
        $questions = $response->json('questions');

        $this->assertNotEmpty($questions);
        $this->assertTrue(collect($questions)->contains(fn (array $q) => str_contains($q['label'], 'satisfied')));
    }

    public function test_client_can_submit_answers_via_tokenized_link(): void
    {
        $template = QuestionnaireTemplate::create([
            'service_slug' => 'web-design',
            'name' => 'Web Design Questionnaire',
            'questions' => [
                ['id' => 'q1', 'label' => 'How satisfied were you?', 'type' => 'rating', 'options' => []],
                ['id' => 'q2', 'label' => 'Any comments?', 'type' => 'text', 'options' => []],
            ],
            'is_active' => true,
        ]);

        $questionnaire = Questionnaire::create([
            'questionnaire_template_id' => $template->id,
            'token' => Str::random(64),
            'customer_name' => 'Questionnaire Client',
            'customer_email' => 'client@example.com',
            'status' => 'pending',
            'requested_at' => now(),
        ]);

        $this->post(route('questionnaires.submit.store', $questionnaire->token), [
            'answers' => [
                'q1' => 5,
                'q2' => 'Great experience overall.',
            ],
        ])->assertSessionHas('success');

        $questionnaire->refresh();

        $this->assertSame('completed', $questionnaire->status);
        $this->assertNotNull($questionnaire->completed_at);
        $this->assertSame(5, $questionnaire->answers['q1']);
        $this->assertSame('Great experience overall.', $questionnaire->answers['q2']);

        $this->post(route('questionnaires.submit.store', $questionnaire->token), [
            'answers' => ['q1' => 1, 'q2' => 'Changed my mind.'],
        ])->assertSessionHas('success');

        $questionnaire->refresh();
        $this->assertSame(5, $questionnaire->answers['q1']);
    }

    public function test_submission_fails_validation_when_required_answer_is_missing(): void
    {
        $template = QuestionnaireTemplate::create([
            'service_slug' => 'web-design',
            'name' => 'Web Design Questionnaire',
            'questions' => [
                ['id' => 'q1', 'label' => 'How satisfied were you?', 'type' => 'rating', 'options' => []],
            ],
            'is_active' => true,
        ]);

        $questionnaire = Questionnaire::create([
            'questionnaire_template_id' => $template->id,
            'token' => Str::random(64),
            'customer_email' => 'client@example.com',
            'status' => 'pending',
            'requested_at' => now(),
        ]);

        $this->post(route('questionnaires.submit.store', $questionnaire->token), [
            'answers' => [],
        ])->assertSessionHasErrors('answers.q1');

        $this->assertSame('pending', $questionnaire->fresh()->status);
    }
}
