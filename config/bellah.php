<?php

$normalizeEmails = static function (string $rawEmails): array {
    return array_values(array_filter(array_map(
        static fn (string $email): string => strtolower(trim($email)),
        explode(',', $rawEmails),
    )));
};

return [
    'staff_emails' => $normalizeEmails((string) env('BELLAH_STAFF_EMAILS', '')),

    'waitlist_admin_emails' => $normalizeEmails((string) env('BELLAH_WAITLIST_ADMIN_EMAILS', 'bellahoptions@gmail.com')),

    'contact_admin_emails' => $normalizeEmails((string) env(
        'BELLAH_CONTACT_ADMIN_EMAILS',
        'ahmed@bellahoptions.com,bellahoptions@gmail.com',
    )),

    'invoice' => [
        'currency' => strtoupper((string) env('BELLAH_INVOICE_CURRENCY', 'NGN')),
        'company_name' => env('BELLAH_COMPANY_NAME', 'Bellah Options'),
        'company_email' => env('BELLAH_COMPANY_EMAIL', env('MAIL_FROM_ADDRESS', 'support@bellahoptions.com')),
        'sender_email' => strtolower(trim((string) env('BELLAH_INVOICE_SENDER_EMAIL', 'billing@bellahoptions.com'))),
        'admin_notification_emails' => $normalizeEmails((string) env(
            'BELLAH_INVOICE_ADMIN_NOTIFICATION_EMAILS',
            (string) env('BELLAH_INVOICE_BCC_EMAIL', env('BELLAH_WAITLIST_ADMIN_EMAILS', 'bellahoptions@gmail.com')),
        )),
    ],

    'payment' => [
        'transfer' => [
            'enabled' => (bool) env('BELLAH_TRANSFER_PAYMENT_ENABLED', true),
            'account_number' => trim((string) env('BELLAH_TRANSFER_ACCOUNT_NUMBER', '4210082961')),
            'account_name' => trim((string) env('BELLAH_TRANSFER_ACCOUNT_NAME', 'Bellah Options')),
            'bank_name' => trim((string) env('BELLAH_TRANSFER_BANK_NAME', 'Fidelity Bank')),
            'instructions' => trim((string) env(
                'BELLAH_TRANSFER_INSTRUCTIONS',
                'Use your invoice number or order code as the transfer reference and send proof of payment to support.',
            )),
        ],
    ],

    'marketing' => [
        'sender_email' => strtolower(trim((string) env('BELLAH_MARKETING_SENDER_EMAIL', 'sales@bellahoptions.com'))),
        'sender_name' => env('BELLAH_COMPANY_NAME', 'Bellah Options'),
        'admin_emails' => $normalizeEmails((string) env(
            'BELLAH_MARKETING_ADMIN_EMAILS',
            env('BELLAH_WAITLIST_ADMIN_EMAILS', 'bellahoptions@gmail.com'),
        )),
    ],

    'orders' => [
        'admin_notification_emails' => $normalizeEmails((string) env(
            'BELLAH_ORDER_ADMIN_NOTIFICATION_EMAILS',
            (string) env('BELLAH_INVOICE_ADMIN_NOTIFICATION_EMAILS', env('BELLAH_WAITLIST_ADMIN_EMAILS', 'bellahoptions@gmail.com')),
        )),
    ],
];
