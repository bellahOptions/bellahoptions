<tr>
    <td style="background:#ffffff; padding:24px 24px 8px;">
        {{--
            Centered with `align="center"` on the cell rather than `margin:auto`
            or flexbox: Outlook ignores both of those on a block image, which is
            why the logo used to sit flush against the left edge.

            The asset is a PNG. Gmail and Outlook refuse SVG in mail, so the
            previous `logo-06.svg` rendered as a broken image for most recipients.
        --}}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td align="center" style="padding-bottom:8px;">
                    <img src="{{ asset('images/email/logo-mark.png') }}"
                         srcset="{{ asset('images/email/logo-mark.png') }} 1x, {{ asset('images/email/logo-mark-3x.png') }} 2x"
                         width="44" height="44"
                         alt="{{ config('bellah.invoice.company_name', 'Bellah Options') }}"
                         style="display:block; width:44px; height:44px; border-radius:10px;">
                </td>
            </tr>
            <tr>
                <td align="center" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:#050a49;">
                    {{ config('bellah.invoice.company_name', 'Bellah Options') }}
                </td>
            </tr>
        </table>
    </td>
</tr>
