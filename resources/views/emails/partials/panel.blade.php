@php
    /*
     | A tonal block for a group of related facts.
     |
     | All input arrives through @include() data, never through a slot: an
     | included Blade partial does not receive the including view's slot, so any
     | body content must be passed as `$content` (already escaped by the caller)
     | or as `$rows`.
     |
     | $tone    default | success | warning | accent
     | $title   optional heading inside the panel
     | $content optional pre-escaped HTML body
     | $rows    optional label => value pairs, rendered as a key/value list
     */
    $tone = (string) ($tone ?? 'default');

    $tones = [
        'default' => ['bg' => '#f8fafc', 'border' => '#e2e8f0', 'heading' => '#102a43', 'text' => '#334155', 'label' => '#64748b'],
        'accent' => ['bg' => '#f5f7ff', 'border' => '#dbe3ff', 'heading' => '#050a49', 'text' => '#334155', 'label' => '#64748b'],
        'success' => ['bg' => '#f0fdf9', 'border' => '#ccfbf1', 'heading' => '#065f46', 'text' => '#134e4a', 'label' => '#0f766e'],
        'warning' => ['bg' => '#fffbeb', 'border' => '#fde68a', 'heading' => '#92400e', 'text' => '#78350f', 'label' => '#b45309'],
    ];

    $style = $tones[$tone] ?? $tones['default'];
    $rows = is_array($rows ?? null) ? $rows : [];
    $content = $content ?? null;
@endphp
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
       style="background:{{ $style['bg'] }}; border:1px solid {{ $style['border'] }}; border-radius:12px;">
    <tr>
        <td style="padding:18px 20px; font-size:14px; line-height:1.7; color:{{ $style['text'] }};">
            @if (! empty($title))
                <p style="margin:0 0 10px; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:{{ $style['heading'] }};">
                    {{ $title }}
                </p>
            @endif

            @if ($rows !== [])
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    @foreach ($rows as $label => $value)
                        <tr>
                            <td class="jv-stack" valign="top" style="padding:4px 14px 4px 0; font-size:14px; color:{{ $style['label'] }}; white-space:nowrap; width:168px;">
                                {{ $label }}
                            </td>
                            <td class="jv-stack jv-stack-gap" valign="top" style="padding:4px 0; font-size:14px; font-weight:600; color:{{ $style['heading'] }};">
                                {!! $value !!}
                            </td>
                        </tr>
                    @endforeach
                </table>
            @elseif ($content !== null)
                {!! $content !!}
            @endif
        </td>
    </tr>
</table>
