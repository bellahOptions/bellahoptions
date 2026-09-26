# Security: human verification and the Turnstile fallback

This note documents the human-verification stack, and specifically the
degraded-mode ("fallback") path that keeps public forms usable when Cloudflare
Turnstile cannot be delivered, without lowering the security floor.

For the equivalent fallback on the payment side (what a customer does when
Paystack or Flutterwave is down), see
[Payments: the bank-transfer fallback](#payments-the-bank-transfer-fallback)
below.

## Layers

| Layer | Purpose |
| --- | --- |
| Cloudflare Turnstile | Primary bot challenge on every public form (login, register, password reset, waitlist, contact, service brief, service order). |
| Rate limiters (`AppServiceProvider`) | Per-IP/per-email throttles on every form endpoint, plus a dedicated throttle on the fallback endpoint. |
| `App\Support\HumanVerification` | Server-authoritative challenge issuing, single-use enforcement, Turnstile `siteverify`, and the degraded-mode fallback. |
| `GET /human-verification/fallback` | Mints a degraded-mode challenge when the widget cannot load. Grants nothing on its own. |
| `App\Support\CrawlerPolicy` | Single source of truth for "should this page be indexed", used by `AddSecurityHeaders`, the exception handler and the public head-tags partial. |

## Fallback design

The fallback exists because a CSP misconfiguration, a blocked CDN, a captive
portal, or a Cloudflare outage previously meant **every** visitor was unable to
submit a form at all.

It is deliberately narrow:

1. **Server chooses the mode.** The challenge mode is minted into the session by
   the server. The client cannot declare "I am using the fallback"; there is no
   request parameter that switches modes.
2. **Turnstile stays first.** A submitted `turnstile_token` is always sent to
   `siteverify` when present, even if a fallback challenge exists. A token that
   fails verification is a hard failure and is never downgraded.
3. **A real attempt is required.** The visitor must have received the primary
   challenge (page render) and the server must have recorded an attempt for that
   session within `TURNSTILE_FALLBACK_ATTEMPT_TTL_MINUTES`. A client that never
   loaded the form can never fall back.
4. **Single-use and session-bound.** The fallback challenge carries a
   `hash_hmac('sha256', nonce|answer, APP_KEY)` digest and a random 32-character
   nonce. It is consumed by the request that presents it, so it cannot be
   replayed. A concurrent in-flight request for the same challenge is rejected
   through an atomic cache claim.
5. **Quota + circuit breaker.** `TURNSTILE_FALLBACK_PER_IP_HOURLY` caps accepted
   degraded submissions per visitor and `TURNSTILE_FALLBACK_GLOBAL_HOURLY` caps
   them platform-wide. Once either is exhausted the server stops minting
   fallbacks and fails closed.
6. **Audited.** Issuing and accepting a fallback both emit `Log::warning`; the
   circuit breaker emits `Log::critical`. IPs are logged as truncated hashes.
7. **Kill switch.** `TURNSTILE_FALLBACK_ENABLED=false` disables the degraded path
   entirely, so forms fail closed and only Turnstile can pass.

If the previous fallback was consumed (for example the submission passed the
human check but then failed unrelated validation), the next form render issues a
fresh challenge automatically, so a visitor is never left holding a spent one.

### Configuration

| Variable | Default | Meaning |
| --- | --- | --- |
| `TURNSTILE_FALLBACK_ENABLED` | `true` | Master switch for the degraded path. |
| `TURNSTILE_FALLBACK_TTL_MINUTES` | `10` | How long an issued fallback stays valid. |
| `TURNSTILE_FALLBACK_PER_IP_HOURLY` | `2` | Accepted degraded submissions per IP per hour. |
| `TURNSTILE_FALLBACK_GLOBAL_HOURLY` | `150` | Platform-wide accepted degraded submissions per hour (circuit breaker). |
| `TURNSTILE_FALLBACK_ISSUES_PER_IP_HOURLY` | `6` | Fallback challenges that may be minted per IP per hour. |
| `TURNSTILE_FALLBACK_ATTEMPT_TTL_MINUTES` | `120` | How long a recorded primary attempt unlocks the fallback. |
| `TURNSTILE_FALLBACK_ENDPOINT_PER_MINUTE` | `3` | Request throttle on the fallback endpoint. |

## Payments: the bank-transfer fallback

The same "don't dead-end the customer" rule applies to payment. When the online
gateway cannot be reached, the customer is offered the platform's own bank
account instead of a broken Pay Now button.

### Where it appears

| Screen | Behaviour |
| --- | --- |
| Order form (`/order/{service}`) | When the *localized preferred processor* (Paystack for Nigeria, Flutterwave cross-border) is unavailable, an amber panel shows the bank, account name, account number, reference hint, instructions and support email. |
| Order payment page (`/orders/{order}/payment`) | The same account is always offered alongside the online checkout, so a customer whose gateway fails after the order exists still has a way to pay. |
| `POST /orders/{order}/payment/transfer` | Records "I have paid by transfer", moves `payment_status` to `processing` and logs a public order update with the customer's bank reference. Rejected when the fallback is disabled. |

### Managed by a super admin

Account details live in the `payment_fallback_json` platform setting and are
edited at **Admin -> Settings -> Payment Fallback Account**
(`settings.payment_fallback`). No code deploy or `.env` edit is needed to change
a bank account.

Environment variables are only bootstrap defaults for fields a super admin has
never saved. Once saved, the database value wins - including a value that was
deliberately blanked, so clearing a field cannot silently resurrect the old
environment value.

| Variable | Meaning |
| --- | --- |
| `BELLAH_TRANSFER_PAYMENT_ENABLED` | Default for the "offer bank transfer" toggle. |
| `BELLAH_TRANSFER_ACCOUNT_NUMBER` | Default account number. |
| `BELLAH_TRANSFER_ACCOUNT_NAME` | Default account name. |
| `BELLAH_TRANSFER_BANK_NAME` | Default bank name. |
| `BELLAH_TRANSFER_INSTRUCTIONS` | Default transfer instructions. |
| `BELLAH_TRANSFER_REFERENCE_HINT` | Default reference hint. |

### Why it stays "valid"

A fallback that shows a wrong or half-typed account number is worse than no
fallback at all, so:

1. **Completeness is enforced at read time.** `PlatformSettings::usablePaymentFallback()`
   returns `enabled = false` unless the toggle is on *and* the bank name,
   account name and account number are all present. An incomplete account is
   never rendered; the order form falls back to "our team will share manual
   payment details".
2. **Account numbers are normalised.** Spaces, dashes and any other
   non-numeric character are stripped before storage, so what a customer copies
   is always bare digits. Input that is not digit-shaped is rejected with a
   validation error.
3. **Partial saves are safe.** The admin form auto-saves one field at a time, so
   each field is stored independently and a half-filled record is a valid
   intermediate state rather than a corruption.
4. **The toggle fails closed.** `enabled = false` hides the transfer option and
   makes `POST .../payment/transfer` reject the submission.

## Tests

- `tests/Feature/TurnstileCaptchaVerificationTest.php` - primary Turnstile path.
- `tests/Feature/TurnstileFallbackChallengeTest.php` - fallback boundaries: no
  self-granted fallback, single use, wrong answer, disabled switch, per-IP quota,
  global circuit breaker, re-issue after consumption, audit logging, throttle.
- `tests/Feature/PaymentFallbackAccountTest.php` - super-admin managed transfer
  account: saving, partial updates, account-number normalisation, and the rule
  that an incomplete or disabled account is never offered to a customer.
- `tests/Feature/PublicSeoHeadTagsTest.php` - structured data and noindex policy.

## Note on the test harness

`phpunit.xml` sets the test environment with both `<server>` and `<env force="true">`
entries. Both are required on hosts that export `APP_ENV`/`SESSION_DRIVER`,
because PHPUnit will not overwrite an existing `getenv()` value and Laravel's env
reader consults `$_SERVER` first. Without them the suite silently boots the
`local` environment (CSRF enabled, database sessions and cache), and every form
POST fails with `419` instead of exercising the application.
