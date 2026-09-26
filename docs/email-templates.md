# Transactional email

Every customer- and staff-facing email extends one shared layout. This note
documents the design system, the email-client constraints it exists to satisfy,
and how to change or preview a template.

## The two bugs this fixed

Both were invisible in a browser and visible in most inboxes.

1. **The header logo was an SVG.** `logo-06.svg` was referenced by 13 templates.
   Gmail and Outlook refuse SVG in mail, so the header rendered as a broken image
   for most recipients.
2. **The logo was centred with flexbox.** `display:flex; justify-content:center`
   on the `<img>` — Outlook renders mail with the Word engine and ignores flex
   entirely, so the logo collapsed against the left edge while the surrounding
   padding kept applying.

A third, cosmetic but obvious one: the invoice template drew a rule with a row of
literal hyphens (`------`).

`tests/Feature/EmailTemplateRenderTest.php` renders every template and asserts
none of these come back.

## Layout

`resources/views/emails/layouts/base.blade.php` provides:

| Section | Purpose |
| --- | --- |
| `preheader` | Inbox preview line. Hidden in the body, shown in the client list. |
| `brand-tagline` | Small line under the wordmark. |
| `hero` | Optional navy header band inside the card. |
| `content` | The message body. |
| `after-content` | Optional block below the body, still inside the card. |
| `footer-links` | Extra footer links, before Terms and Privacy. |
| `footer-note` | Optional line under the copyright. |

A template is therefore:

```blade
@extends('emails.layouts.base')

@section('preheader', 'One line for the inbox list.')
@section('hero')
    <h1 style="...">Heading</h1>
@endsection
@section('content')
    <p style="...">Body</p>
    @include('emails.partials.button', ['url' => $url, 'label' => 'Do the thing'])
@endsection
```

### Components

| Partial | Notes |
| --- | --- |
| `emails.partials.button` | Table-cell button. A padded `<a>` collapses in Outlook. |
| `emails.partials.panel` | Tonal fact block. Tones: `default`, `accent`, `success`, `warning`. Takes `$rows` (label => value) or `$content` (pre-escaped HTML). |
| `emails.partials.logo-mark` | Compact brand lockup for templates with bespoke bodies. |
| `emails.partials.logo-header` | Full-width centred lockup. |

> **Partials take data, not slots.** An `@include`d partial does not receive the
> including view's slot, so any body content must arrive as `$content` or `$rows`.

### Email-client rules

- Layout is tables. Never flexbox, never grid.
- Centre with `align="center"` on a cell. Outlook ignores `margin:auto` on a block
  image.
- Inline CSS only. The one `<style>` block holds progressive enhancements (dark
  mode, mobile padding) that degrade harmlessly.
- The logo is a PNG with a `srcset` 2x candidate.

## Brand assets

```
php scripts/build-email-brand-assets.php
```

Writes `public/images/email/logo-mark.png` (96px) and `logo-mark-3x.png` (144px)
from `public/icon.jpg`, cropped to the glyph and re-encoded as PNG so there is no
JPEG ringing around the edges.

A super admin can point the header at their own upload via the
`email-logo` entry in **Service Page & Modal Images** — the rasterised brand mark
stays the default.

**I could not rasterise the wordmark.** The `logo-06.svg` wordmark needs an SVG
renderer and none is installed here (no ImageMagick, rsvg, Inkscape or `sharp`).
The layout therefore pairs the square brand mark with the company name set as
text, which is sharp at any zoom and survives images being blocked. If you want
the exact wordmark, export a PNG from the SVG at 96px and 144px into
`public/images/email/` and update the two `asset()` calls in
`resources/views/emails/layouts/base.blade.php`.

## Previewing

```
php scripts/preview-email.php emails.invoice-issued
php scripts/preview-email.php emails.staff-login-otp
```

Writes to `storage/app/email-previews/`. Open the file in a browser to check
markup and assets. This is not a substitute for testing in a real client — use
Litmus or Email on Acid before a major send, since Gmail, Outlook and Apple Mail
each differ.

## Admin-authored templates

`Email Center` lets a super admin override a template's subject, sender and body.
The body is stored as an HTML fragment and, as of this change, is wrapped in the
shared layout — so a custom template inherits the brand header and the legal
footer instead of rendering as an unbranded white box.

Field substitution escapes every value (`NewsletterTemplating::renderHtml`), so a
customer name containing markup cannot inject into the email.

## Tests

- `tests/Feature/EmailTemplateRenderTest.php` — renders all 26 transactional
  templates, and asserts no SVG assets, no flexbox, no ASCII dividers, and that
  the refactored templates carry the shared layout markers.
- `tests/Feature/EmailLayoutTest.php` — layout behaviours: preheader, footer legal
  links, the super-admin-managed transfer account on invoices, and the fallback
  when no account is configured.
