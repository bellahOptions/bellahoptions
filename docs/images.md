# Images: upload, storage, delivery

This note covers how an image gets from an admin's file picker to a visitor's
screen, and how to fix it when it does not.

## The short version

- **Uploads** go through `App\Contracts\ImageUploader`. The default binding is
  `LocalImageUploader`, which uses the local image engine and needs no
  third-party credentials.
- **Cloudinary** is still supported and is selected automatically when
  `CLOUDINARY_URL` is set. The Cloudinary driver itself still fails loudly if it
  is chosen and misconfigured; only the *default binding* falls back.
- **Storage** is the `media` disk at `storage/app/media`.
- **Delivery** is the `media.show` route (`/media/{folder}/{name}`), served with
  `Cache-Control: public, max-age=31536000, immutable`.
- **Variants** are generated at upload time (WebP at 320/480/640/960/1280/1600/2000
  where genuinely smaller) and surfaced to components as `srcset`.

## Why it used to break

Two independent faults, both of which made images "upload fine but never show":

1. **`CLOUDINARY_URL` was empty.** Every upload threw
   `Image upload is not configured yet`, so no image could be added at all.
2. **Delivery depended on `public/storage`.** The symlink was absent, and most
   shared hosting cannot follow a symlink out of the web root anyway. A file
   could be written successfully and still 404 in the browser.

Neither is a code bug in the Cloudinary client. Both are the kind of failure
that only shows up in deployment, which is why the engine no longer depends on
either a credential or a symlink.

## Stored path shape

A stored value is always one of:

| Shape | Source | Variants? |
| --- | --- | --- |
| `/media/{folder}/{sha1}[-{width}][@2x].{ext}` | the local engine | yes |
| `https://res.cloudinary.com/...` | Cloudinary | Cloudinary transforms |
| `/images/foo.jpg` | legacy `public/` asset | no |

`MediaPath` validates the local shape by pattern rather than by touching the disk,
so a request for a variant cannot traverse out of the media directory. The file
name charset is deliberately tiny: 40 hex characters, optional `-<width>`, one
extension from a fixed list.

> **Note on the disk path.** `MediaPath::storagePath()` returns the path *within*
> the disk (`{folder}/{name}`), because the disk root is already
> `storage/app/media`. An earlier revision prepended `media/` as well, which
> wrote to `storage/app/media/media/...` and made every variant lookup miss. The
> `MediaDeliverySmokeTest` exists specifically to keep that from coming back.

## Uploading

| Endpoint | Access | Purpose |
| --- | --- | --- |
| `POST /admin/media/upload` | super admin | General-purpose upload, optional validated `folder`. |
| `GET /admin/media/library` | super admin | Media picker listing. |
| `POST /admin/gallery/media/upload` | super admin | Gallery-specific (crops, records `gallery-projects`). |
| `POST /admin/gallery/media/crop` | super admin | Re-process an existing image at a fixed aspect. |

The front end uses `ImagePickerField`, which offers upload, library pick and
clear, and previews the result. It is the single implementation now; the gallery,
service pricing and email centre screens previously each had their own copy.

## Displaying

Use `FastImage` rather than a bare `<img>`:

```jsx
<FastImage
    src={content.image}
    variants={content.image_variants}
    alt="…"
    sizes="(min-width: 1024px) 45vw, 100vw"
    width={1600}
    height={2000}
    priority          // only for the hero / above-the-fold image
/>
```

It emits `srcset`/`sizes` when variants exist, reserves layout space from
`width`/`height` so the page does not shift, and defers offscreen images. With no
variants it degrades to a plain lazy-loaded `<img>`, which is what legacy and
Cloudinary URLs get.

Server side, props carry variants from `Media::variants($value)`. `Media::url()`
is the single sanitiser: it rejects `javascript:`, protocol-relative `//host/...`
and bare relative paths, so a stored value is always safe to render.

## A note on `public/optimized/`

That directory holds 54 hand-generated WebP variants with no code referencing
them. They predate the engine and are now dead weight. The engine supersedes them
because variants are generated automatically on upload instead of being produced
by hand and committed. Nothing to do to "fix" it — it is safe to delete — but it
is left alone here because it is outside the scope of this change.

## Configuration

| Variable | Default | Meaning |
| --- | --- | --- |
| `CLOUDINARY_URL` | empty | When set, uploads go to Cloudinary instead of the local engine. |
| `FILESYSTEM_DISK` | `local` | Unrelated to images; the engine always uses the `media` disk. |

No configuration is required for the local engine to work.

## Tests

- `tests/Feature/ImageEngineTest.php` — storage, downscaling, variant generation,
  immutable caching, conditional requests, deletion, traversal rejection.
- `tests/Feature/MediaDeliverySmokeTest.php` — real-disk round trip through the
  delivery route, including the no-double-prefix assertion.
- `tests/Feature/ServiceImageSettingsTest.php` — super-admin image overrides and
  the shared admin media endpoints.
- `tests/Feature/CloudinaryUploadIntegrationTest.php` — Cloudinary path (faked)
  and the new local fallback.
