<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unanswered Support Ticket Reminder</title>
</head>
<body style="margin:0; padding:24px 12px; background:#f8fafc; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px;">
                    <tr>
                        <td style="padding:24px;">
                            <h2 style="margin:0 0 12px; font-size:20px; color:#0f172a;">Unanswered Ticket Reminder</h2>
                            <p style="margin:0 0 12px; font-size:14px; line-height:1.7;">This ticket is still waiting for a staff response.</p>
                            <p style="margin:0 0 8px; font-size:14px;"><strong>Ticket:</strong> {{ $ticket->ticket_number }}</p>
                            <p style="margin:0 0 8px; font-size:14px;"><strong>Customer:</strong> {{ $ticket->user?->name ?: 'Unknown' }} ({{ $ticket->user?->email ?: 'N/A' }})</p>
                            <p style="margin:0 0 8px; font-size:14px;"><strong>Subject:</strong> {{ $ticket->subject }}</p>
                            <p style="margin:0 0 16px; font-size:14px;"><strong>Last customer reply:</strong> {{ $ticket->last_customer_reply_at?->toDateTimeString() ?: 'N/A' }}</p>
                            <a href="{{ route('admin.support-tickets.index') }}" style="display:inline-block; background:#000285; color:#ffffff; text-decoration:none; padding:10px 14px; border-radius:8px; font-size:14px; font-weight:700;">Open Ticket Desk</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
