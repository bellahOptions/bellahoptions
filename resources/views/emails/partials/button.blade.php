@php
    /*
     | Bulletproof call-to-action button.
     |
     | A bare `<a>` with padding collapses in Outlook, so this uses the
     | table-cell + align approach: Outlook renders the cell background, every
     | other client renders the anchor. Both end up looking identical.
     */
    $buttonUrl = (string) ($url ?? '#');
    $buttonLabel = (string) ($label ?? 'Open');
    $buttonBg = (string) ($background ?? '#050a49');
    $buttonColor = (string) ($color ?? '#ffffff');
    $buttonAlign = (string) ($align ?? 'left');
    $buttonWidth = isset($fullWidth) && $fullWidth ? 'width:100%;' : '';
@endphp
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="{{ $buttonAlign }}" style="margin:0; {{ $buttonAlign === 'center' ? 'margin-left:auto; margin-right:auto;' : '' }}">
    <tr>
        <td align="center" bgcolor="{{ $buttonBg }}" style="border-radius:8px; {{ $buttonWidth }}">
            <a href="{{ $buttonUrl }}"
               target="_blank"
               style="display:inline-block; padding:13px 26px; font-size:14px; font-weight:700; line-height:1.2; color:{{ $buttonColor }}; background:{{ $buttonBg }}; border-radius:8px; text-decoration:none; {{ $buttonWidth }}">
                {{ $buttonLabel }}
            </a>
        </td>
    </tr>
</table>
