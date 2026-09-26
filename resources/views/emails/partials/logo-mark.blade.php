{{--
    Compact brand lockup for templates that keep their own bespoke body markup.

    Centered with `align="center"` on the cell: Outlook ignores `margin:auto` and
    flexbox on a block image, which is why the logo used to sit flush left.

    The asset is a PNG because Gmail and Outlook refuse SVG in mail.
--}}
<tr>
    <td align="center" style="padding:22px 24px 10px;">
        <img src="{{ asset('images/email/logo-mark.png') }}"
             srcset="{{ asset('images/email/logo-mark.png') }} 1x, {{ asset('images/email/logo-mark-3x.png') }} 2x"
             width="46" height="46"
             alt="{{ config('bellah.invoice.company_name', 'Bellah Options') }}"
             style="display:block; width:46px; height:46px; border-radius:11px; margin:0 auto;">
        <p style="margin:8px 0 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; color:#050a49;">
            {{ config('bellah.invoice.company_name', 'Bellah Options') }}
        </p>
    </td>
</tr>
