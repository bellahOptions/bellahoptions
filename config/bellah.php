<?php

return [
    'staff_emails' => array_values(array_filter(array_map(
        static fn (string $email): string => strtolower(trim($email)),
        explode(',', (string) env('BELLAH_STAFF_EMAILS', '')),
    ))),

    'waitlist_admin_emails' => array_values(array_filter(array_map(
        static fn (string $email): string => strtolower(trim($email)),
        explode(',', (string) env('BELLAH_WAITLIST_ADMIN_EMAILS', 'bellahoptions@gmail.com')),
    ))),

    'invoice' => [
        'currency' => strtoupper((string) env('BELLAH_INVOICE_CURRENCY', 'NGN')),
        'company_name' => env('BELLAH_COMPANY_NAME', 'Bellah Options'),
        'company_email' => env('BELLAH_COMPANY_EMAIL', env('MAIL_FROM_ADDRESS', 'support@bellahoptions.com')),
        'sender_email' => strtolower(trim((string) env('BELLAH_INVOICE_SENDER_EMAIL', 'billing@bellahoptions.com'))),
        'bcc_email' => strtolower(trim((string) env('BELLAH_INVOICE_BCC_EMAIL', 'bellahoptions@gmail.com'))),
    ],
];
