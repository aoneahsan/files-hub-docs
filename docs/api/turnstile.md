---
sidebar_position: 12
title: Verify a Turnstile token
description: POST /api/v1/turnstile/verify checks a Cloudflare Turnstile token using the secret key stored in your project's vault, so the secret never has to reach your frontend or a Cloudflare Worker.
keywords: [fileshub turnstile, cloudflare turnstile api, captcha verification, siteverify, POST /api/v1/turnstile/verify, bot protection, turnstile secret key]
last_update:
  date: 2026-08-24
  author: Ahsan Mahmood
---

# Verify a Turnstile token

`POST /api/v1/turnstile/verify` — added in backend `2026.08.24.1`.

[Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) gives you two keys: a **site key** that
renders the widget in the browser, and a **secret key** that validates the resulting token. The secret must
never ship in a bundle — which normally means you need a server just to hold it.

FilesHub holds it for you. Store the pair in your project's vault, and this endpoint spends the secret
against Cloudflare on your behalf:

```
browser  ──token──▶  FilesHub  ──token + secret──▶  Cloudflare siteverify
                        │
                        └──── verdict ────▶  your app
```

Your frontend then carries only the site key and an origin-restricted FilesHub key. **A project with no
backend of its own — a static or Firebase-hosted app — can use Turnstile without standing up a worker for
one form.**

## Store the keys first

The vault service is `turnstile`. Enter it in the admin panel, or over the Management API:

```bash
curl -X PUT https://fileshub.zaions.com/api/public/v1/projects/my-project/vault/turnstile \
  -H "Authorization: Bearer fh_pat_..." \
  -H "Content-Type: application/json" \
  -d '{
        "values": {
          "site_key":   "0x4AAAAAAA...",
          "secret_key": "0x4AAAAAAA...",
          "hostnames":  "app.example.com, www.example.com"
        }
      }'
```

| Field | Purpose |
|---|---|
| `site_key` | Renders the widget. Public by design — it appears in the generated `VITE_`/`NEXT_PUBLIC_` env blocks |
| `secret_key` | Validates the challenge. **Secret** — encrypted at rest and never returned outside an audited reveal |
| `widget_name` | The widget's name in the Turnstile dashboard. Cloudflare lists keys, not the form each one guards |
| `widget_mode` | `managed`, `non-interactive` or `invisible` — affects your frontend, not the verification |
| `hostnames` | The widget's allowed-hostname list, recorded so a mismatch is diagnosable. A hostname missing from it is rejected **at Cloudflare**, and your app just sees a failure |
| `expected_action` | Optional — see [Action checking](#action-checking) |

## Verify

```bash
curl -X POST https://fileshub.zaions.com/api/v1/turnstile/verify \
  -H "X-API-Key: fh_live_..." \
  -H "Content-Type: application/json" \
  -d '{"token": "<the cf-turnstile-response field from your form>"}'
```

| Parameter | | Notes |
|---|---|---|
| `token` | required | The widget's response, max 4096 chars. **`response` is accepted as an alias** — Cloudflare's own parameter name, so migrating off a direct `siteverify` call means changing the URL and nothing else |
| `remoteip` | optional | Forwarded only when you send it — see [remoteip](#a-note-on-remoteip) |
| `idempotency_key` | optional | Lets you re-verify the same token. Turnstile tokens are single-use; without this a retry returns `timeout-or-duplicate` |
| `action` | optional | Overrides the vault's `expected_action` for this call |

The key needs the `turnstile` permission and `can_read`. It does **not** need write access — the endpoint
stores nothing, so an origin-restricted read key is enough to put in your page.

```json
{
  "success": true,
  "status": "verified",
  "error_codes": [],
  "hostname": "app.example.com",
  "challenge_ts": "2026-08-24T10:00:00Z",
  "action": "signup",
  "cdata": null
}
```

## :red_circle: A failed challenge is `200`, not an error

This is the part to get right in your integration.

| Situation | Status | Body |
|---|---|---|
| Cloudflare answered, the visitor **passed** | `200` | `success: true` |
| Cloudflare answered, the visitor **failed** | `200` | `success: false` with `error_codes` |
| No Turnstile secret stored for the project | `409` | `status: "not_configured"` |
| A secret is stored but cannot be decrypted | `409` | `status: "unreadable"` |
| Missing or oversized token | `422` | `message` |
| Cloudflare unreachable, or its answer unreadable | `502` | `status: "upstream_failed"` |

A visitor failing a captcha is a normal outcome, not an API error. If it were a `4xx`, you would have to tell
"FilesHub is broken" apart from "the visitor failed" by parsing a message — and an integration that skipped
that step would treat an outage as a bot and reject every real person.

So: **branch on `success` for the verdict, and on the status code for whether the verdict means anything.**

```js
const res  = await fetch('https://fileshub.zaions.com/api/v1/turnstile/verify', {
  method: 'POST',
  headers: { 'X-API-Key': KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ token }),
});
const body = await res.json();

if (!res.ok) {
  // 409 / 422 / 502 — our problem, not the visitor's. Do not blame them.
  throw new Error(body.message ?? body.status);
}

if (!body.success) {
  // The visitor genuinely failed the challenge.
  return showChallengeFailed();
}
```

The two `409`s are deliberately distinct because the fixes differ: `not_configured` means *store a secret*,
`unreadable` means *re-enter it — it was encrypted under a different key*.

## Action checking

Turnstile lets a widget declare an `action` (`signup`, `login`, …) which Cloudflare echoes back on
verification. Without checking it, **a token minted on your signup form is a perfectly valid token on your
login form.**

Record the expected value once, in the vault's `expected_action`, and this endpoint enforces it. A mismatch
comes back as:

```json
{ "success": false, "status": "verified", "error_codes": ["fileshub-action-mismatch"], "action": "login" }
```

:red_circle: **That code is ours, not Cloudflare's** — the `fileshub-` prefix says so. If you match on
`error_codes`, you can always tell a verdict Cloudflare returned from one FilesHub added, and a future
Cloudflare code can never silently collide with it.

## A note on `remoteip`

Cloudflare accepts the visitor's IP as an optional extra signal. FilesHub sends it **only if you do**, and
that is deliberate: our own view of the request IP is the visitor only when the browser calls us directly.
If your backend proxies the call, it is your *server's* address — and handing Cloudflare the wrong IP fails a
challenge the visitor actually passed.

If your backend is making the call and you have the real client IP, pass it. Otherwise leave it out.

## Testing

Cloudflare publishes [dummy keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) that
always pass or always fail. Store those in the vault while you build, rather than a real key you then have to
rotate.

The admin panel also carries a **Test Turnstile secret** action, which sends your stored secret with a
deliberately invalid token. Cloudflare validates the secret before it looks at the token, so
`invalid-input-response` back means the secret is good, while `invalid-input-secret` means it is wrong.

:red_circle: That test cannot prove your site key and secret key belong to the **same** widget — only a real
token from a browser can show that. Do a real submit before you trust the integration.

## Rate limit

60 requests per minute per API key. This endpoint proxies a third-party call, unlike the rest of the data
plane, which only touches FilesHub's own storage.
