<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Share Project Content and Assets</title>
</head>
<body style="margin:0; padding:24px 12px; background:#f8fafc; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px;">
                    <tr>
                        <td style="padding:24px;">
                            <h2 style="margin:0 0 12px; font-size:20px; color:#0f172a;">Next Step: Send Your Project Files</h2>
                            <p style="margin:0 0 12px; font-size:14px; line-height:1.7;">
                                Hi {{ $order->full_name ?: 'there' }}, based on your order form responses, please send the ready items for order <strong>{{ $order->order_code }}</strong>.
                            </p>

                            <div style="margin:12px 0 16px; padding:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;">
                                @if ($hasContentReady)
                                    <p style="margin:0 0 8px; font-size:14px;"><strong>Content:</strong> Please send your captions/copy/text content.</p>
                                @endif
                                @if ($hasBrandAssetsReady)
                                    <p style="margin:0; font-size:14px;"><strong>Brand Assets:</strong> Please send your logo, brand colors, and any existing brand files.</p>
                                @endif
                            </div>

                            <p style="margin:0 0 12px; font-size:14px; line-height:1.7;">
                                You can reply directly to this email with links (Google Drive/Dropbox/OneDrive) or attachments where possible.
                            </p>
                            <p style="margin:0; font-size:13px; line-height:1.7; color:#64748b;">
                                If anything changed since you placed the order, reply and we’ll adjust your production plan.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
