@php
    /*
     | Every transactional email extends this layout.
     |
     | Email-client constraints this file exists to handle:
     |
     |  * Layout is tables, never flexbox or grid. Outlook (Word renderer) drops
     |    both, which is why the old logo always collapsed to the left edge.
     |  * Centering is `align="center"` on a cell, not `margin:auto` on an image,
     |    because Outlook ignores auto margins on block images.
     |  * The logo is a PNG. Gmail and Outlook refuse SVG in mail, so the previous
     |    `logo-06.svg` header rendered as a broken image in most inboxes.
     |  * Only inline CSS and a single small <style> block for the few
     |    progressive enhancements that degrade harmlessly (dark mode, mobile
     |    padding). No external stylesheet, no class-only styling.
     |  * A hidden preheader supplies the inbox preview line so a client does not
     |    fall back to "View this email in your browser" or raw markup.
     */

    $emailCompanyName = trim((string) config('bellah.invoice.company_name', 'Bellah Options'));
    $emailAccent = '#050a49';
    $emailAccentSoft = '#2b3a8f';
    $emailInk = '#102a43';
    $emailBody = '#334155';
    $emailMuted = '#64748b';
    $emailLine = '#e2e8f0';
    $emailGround = '#f4f6fb';
    $emailSupportEmail = trim((string) config('bellah.invoice.company_email', 'support@bellahoptions.com'));
    $emailSiteUrl = rtrim(\App\Support\PlatformSettings::siteUrl(), '/');
    $emailBrand = \App\Support\PlatformSettings::brandAssets();
    $emailLogo = asset('images/email/logo-mark.png');
    $emailLogo3x = asset('images/email/logo-mark-3x.png');

    // A super admin can point the header at their own upload; the rasterised
    // brand mark stays the default.
    $emailLogoOverride = \App\Support\PlatformSettings::serviceImages()['email-logo'] ?? null;

    if (is_string($emailLogoOverride) && $emailLogoOverride !== '') {
        $emailLogo = str_starts_with($emailLogoOverride, 'http')
            ? $emailLogoOverride
            : rtrim((string) config('app.url'), '/').'/'.ltrim($emailLogoOverride, '/');
        $emailLogo3x = $emailLogo;
    }
@endphp
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>@yield('title', $emailCompanyName)</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        /* Progressive enhancement only. Everything critical is inline above. */
        body { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table { border-collapse: collapse; mso-table-lspace: 0; mso-table-rspace: 0; }
        img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        a { text-decoration: none; }

        @media (max-width: 620px) {
            .jv-wrap { padding: 12px 8px !important; }
            .jv-pad { padding-left: 20px !important; padding-right: 20px !important; }
            .jv-stack { display: block !important; width: 100% !important; }
            .jv-stack-gap { padding-top: 12px !important; }
            .jv-h1 { font-size: 21px !important; line-height: 1.3 !important; }
            .jv-amount { font-size: 26px !important; }
            .jv-hide-sm { display: none !important; }
            .jv-center-sm { text-align: center !important; }
            .jv-logo-cell { padding-right: 0 !important; }
        }
    </style>
</head>
<body style="margin:0; padding:0; width:100%; background:{{ $emailGround }}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:{{ $emailBody }};">

    {{-- Inbox preview line: shown in the client list, hidden in the body. --}}
    <div style="display:none; font-size:1px; color:{{ $emailGround }}; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
        @yield('preheader', 'A message from '.$emailCompanyName)
        {{-- Padding stops clients pulling following body copy into the preview. --}}
        &#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:{{ $emailGround }};">
        <tr>
            <td align="center" class="jv-wrap" style="padding:28px 16px;">

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px; width:100%;">

                    {{-- ── Brand bar ── --}}
                    <tr>
                        <td style="padding:0 4px 16px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td class="jv-logo-cell" valign="middle" style="padding-right:12px; width:48px;">
                                        <img src="{{ $emailLogo }}"
                                             srcset="{{ $emailLogo }} 1x, {{ $emailLogo3x }} 2x"
                                             width="48" height="48" alt="{{ $emailCompanyName }}"
                                             style="display:block; width:48px; height:48px; border-radius:12px;">
                                    </td>
                                    <td valign="middle">
                                        <p style="margin:0; font-size:15px; font-weight:700; letter-spacing:0.02em; color:{{ $emailInk }}; text-transform:uppercase;">
                                            {{ $emailCompanyName }}
                                        </p>
                                        <p style="margin:3px 0 0; font-size:12px; color:{{ $emailMuted }};">
                                            @yield('brand-tagline', 'Creative &amp; digital delivery')
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- ── Card ── --}}
                    <tr>
                        <td style="background:#ffffff; border:1px solid {{ $emailLine }}; border-radius:16px; overflow:hidden;">

                            @hasSection('hero')
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td class="jv-pad" style="background:{{ $emailAccent }}; padding:26px 32px;">
                                            @yield('hero')
                                        </td>
                                    </tr>
                                </table>
                            @endif

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td class="jv-pad" style="padding:32px; font-size:15px; line-height:1.7; color:{{ $emailBody }};">
                                        @yield('content')
                                    </td>
                                </tr>
                            </table>

                            @hasSection('after-content')
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td class="jv-pad" style="padding:0 32px 32px;">
                                            @yield('after-content')
                                        </td>
                                    </tr>
                                </table>
                            @endif
                        </td>
                    </tr>

                    {{-- ── Footer ── --}}
                    <tr>
                        <td style="padding:20px 8px 4px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td class="jv-center-sm" style="font-size:12px; line-height:1.7; color:{{ $emailMuted }};">
                                        <p style="margin:0 0 6px;">
                                            <a href="{{ $emailSiteUrl }}" style="color:{{ $emailAccentSoft }}; font-weight:600;">{{ preg_replace('#^https?://#', '', $emailSiteUrl) }}</a>
                                            &nbsp;·&nbsp;
                                            <a href="mailto:{{ $emailSupportEmail }}" style="color:{{ $emailAccentSoft }}; font-weight:600;">{{ $emailSupportEmail }}</a>
                                        </p>
                                        <p style="margin:0 0 6px;">
                                            @yield('footer-links')
                                            <a href="{{ $emailSiteUrl }}/terms-of-service" style="color:{{ $emailMuted }}; text-decoration:underline;">Terms</a>
                                            &nbsp;·&nbsp;
                                            <a href="{{ $emailSiteUrl }}/privacy-policy" style="color:{{ $emailMuted }}; text-decoration:underline;">Privacy</a>
                                        </p>
                                        <p style="margin:0; color:#94a3b8;">
                                            &copy; {{ now()->format('Y') }} {{ $emailCompanyName }}. All rights reserved.
                                        </p>
                                        @hasSection('footer-note')
                                            <p style="margin:8px 0 0; color:#94a3b8;">@yield('footer-note')</p>
                                        @endif
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>
</body>
</html>
