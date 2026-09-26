<?php

/**
 * Renders a transactional email to an HTML file for manual inspection.
 *
 *   php scripts/preview-email.php emails.invoice-issued
 *   php scripts/preview-email.php emails.staff-login-otp > storage/app/preview.html
 *
 * The file is written to storage/app/email-previews/ so it can be opened in a
 * browser. Email clients are the real target, but this catches broken markup,
 * missing assets and layout mistakes before anything is sent.
 */
require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Invoice;
use App\Models\User;
use Illuminate\Support\Facades\View;

$view = $argv[1] ?? 'emails.invoice-issued';

$admin = User::query()->firstOrCreate(
    ['email' => 'preview-admin@example.com'],
    [
        'uuid' => (string) Illuminate\Support\Str::uuid(),
        'name' => 'Ahmed Bello',
        'password' => bcrypt('password'),
        'role' => User::ROLE_SUPER_ADMIN,
    ],
);

$invoice = Invoice::query()->firstOrCreate(
    ['invoice_number' => 'BO-PREVIEW-0001'],
    [
        'customer_name' => 'Ada Lovelace',
        'customer_email' => 'ada@example.com',
        'title' => 'Brand Identity Package',
        'description' => 'Full identity system with guidelines.',
        'amount' => 250000,
        'currency' => 'NGN',
        'status' => 'paid',
        'payment_reference' => 'PSK-REF-PREVIEW',
        'paid_at' => now(),
        'issued_at' => now(),
        'created_by' => $admin->id,
    ],
);

$data = match ($view) {
    'emails.invoice-issued', 'emails.invoice-paid-receipt' => ['invoice' => $invoice],
    'emails.staff-login-otp' => ['user' => $admin, 'otpCode' => '482913', 'expiresInMinutes' => 10],
    'emails.dynamic-template' => [
        'htmlBody' => '<h2 style="margin:0 0 12px; font-size:20px; color:#102a43;">Custom template body</h2>'
            .'<p style="margin:0; font-size:15px; line-height:1.7; color:#334155;">This is what an admin-authored template looks like inside the shared layout.</p>',
        'emailTemplateName' => 'Custom Notification',
    ],
    default => [],
};

$html = View::make($view, $data)->render();

$directory = __DIR__.'/../storage/app/email-previews';

if (! is_dir($directory)) {
    mkdir($directory, 0o755, true);
}

$file = $directory.'/'.str_replace('.', '-', $view).'.html';
file_put_contents($file, $html);

printf("%s (%s KB)%s", $file, number_format(strlen($html) / 1024, 1), PHP_EOL);
