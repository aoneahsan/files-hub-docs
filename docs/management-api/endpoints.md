---
sidebar_position: 3
title: Management API endpoints
description: Full endpoint reference for the FilesHub Public Management API — projects, API keys (create, rotate, reveal), origins, global origins, and reverse key lookup, with request and response examples.
keywords: [fileshub management api endpoints, create project api, create api key api, rotate api key, reveal api key, manage origins api, global origins api, api-keys lookup, access token]
last_update:
  date: 2026-07-30
  author: Ahsan Mahmood
---

# Endpoint reference

Base URL `https://fileshub.zaions.com/api/public/v1`. Every request needs
`Authorization: Bearer fh_pat_...` (see [Authentication](./authentication.md)). Lists are paginated
(`per_page` default 20, max 50) and return `{"data": [...], "meta": {...}}`. Everything else returns
`{"data": ...}`. The machine spec is in [`openapi.json`](https://fileshub-docs.zaions.com/openapi.json).

## Token

### `GET /token`
Introspect the current token — name, scope, expiry, last use. The intended first call.

## Projects

### `GET /projects`
List the projects this token may manage. Query: `q` (substring match on name or slug), `status`
(`active` / `inactive`), `per_page`, `page`. Each item includes `api_keys_count`.

### `POST /projects`
Create a project. Body: `name` (required), optional `slug` (auto-generated from the name if omitted),
`status` (`active` default), `notes`.

```bash
curl -X POST .../projects -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"My Web App"}'
```
```json
{ "data": { "id": 42, "public_id": "01KX...", "name": "My Web App", "slug": "my-web-app", "status": "active", "notes": null, "created_at": "2026-07-18T..." } }
```

### `GET /projects/{project}`
Fetch one project by **numeric id, ULID `public_id`, or slug**. Includes a summary `api_keys` list.

### `PATCH /projects/{project}`
Update `name`, `slug`, `status`, or `notes`.

### `DELETE /projects/{project}`
Delete a project. **Cascades** its API keys, origins, stored objects, and audit logs. The response
reports what went with it:
```json
{ "data": { "deleted": true, "cascade": { "api_keys": 3, "stored_objects": 128 } } }
```

## API keys

`{project}` accepts an id, `public_id`, or slug; `{apiKey}` is the numeric key id. The safe
representation never includes the hash or plaintext — the secret is returned **only** by create,
rotate, and reveal.

### `GET /projects/{project}/api-keys`
List the project's keys (prefix, permissions, `restricted`, `is_active`, `origins_count`).

### `POST /projects/{project}/api-keys`
Create a key. Body: `name` (required); optional `can_read` / `can_write` / `can_send_emails`,
`restricted`, `allow_no_origin`, `email_daily_limit`, `rate_limit_per_minute`, `permissions`
object, `is_test`. **Every omitted boolean defaults to `false`** — ask for the capabilities you
want. **Returns the plaintext once, flat under `data`** alongside the key's fields:
```json
{ "data": { "id": 7, "key_prefix": "fh_live_ab12", "can_read": true, "restricted": false, "plaintext_key": "fh_live_ab12..." } }
```
:::note Changed 2026-07-18
Create and rotate used to nest the key under `data.api_key`, so `data.id` read back as `undefined`.
Both are flat now, matching every other key endpoint. Omitted booleans also stored as `null` before;
they are real `false` values now.
:::

### `GET /projects/{project}/api-keys/{apiKey}`
Fetch one key (safe representation).

### `PATCH /projects/{project}/api-keys/{apiKey}`
Update `name`, the `can_*` flags, `restricted`, `allow_no_origin`, limits, `permissions`, or
`is_active`. Turning `restricted` on with no origins denies every request — add origins first
(below), or rely on the platform-wide [global origins](#global-origins) an administrator has
configured (check those first; a key does not need its own copy of one).

#### `allow_no_origin` — restricting a server-side key

A restricted key refuses any request that carries neither an `Origin` nor an `X-App-Id` header.
Browsers always send `Origin`; server-side HTTP clients (Laravel/Guzzle, Cloudflare Workers, Node
CLIs, Flutter's `dart:io`) send none, so such keys had to be left unrestricted.

Set `allow_no_origin: true` and a restricted key accepts header-less requests while still matching
every request that *does* send an `Origin` against its allowlist. Be honest about the guarantee:
absence of a header proves nothing, so `curl` passes too — this is weaker than an origin check, and
much stronger than leaving the key unrestricted.

### `DELETE /projects/{project}/api-keys/{apiKey}`
Delete a key; its origins cascade.

### `POST /projects/{project}/api-keys/{apiKey}/rotate`
Issue a new secret. The old key stops working immediately. Returns the new `plaintext_key`.

### `POST /projects/{project}/api-keys/{apiKey}/reveal`
Re-read the stored plaintext for a key you already created. Returns `409 PLAINTEXT_UNAVAILABLE` for
legacy keys minted before plaintext was retained — rotate to get a fresh one.

## Origins

Manage a key's allowed origins. Domain values are validated against the same **scheme + port**
policy as the dashboard and stored canonically, so the response shows the exact origin a browser
sends (`example.com` → `https://example.com`). See
[API key restrictions](../getting-started/api-key-restrictions.md) for the full policy.

### `GET .../api-keys/{apiKey}/origins`
List the key's origins.

Browser extensions use `type: "domain"` with an extension scheme —
`chrome-extension://<id>` (also `moz-extension://`, `safari-web-extension://`), where the host is
the extension id. These carry no port and no wildcard. Only Chrome ids are stable: a Firefox or
Safari extension id is a per-install UUID, so such an entry matches a single machine.

Some origins are configured platform-wide by an administrator (**global origins**) and are accepted
by *every* restricted key without appearing in this list — typically local dev hosts and the
Capacitor WebView origins. They are dashboard-managed, but they are **readable** here: see
[Global origins](#global-origins) below, and check them **before** adding anything, or you will add
duplicates the key never needed.

### `POST .../api-keys/{apiKey}/origins`
Add one. Body: `type` (`domain` / `android` / `ios`), `value`, and — android only —
`sha256_fingerprints[]` / `sha1_fingerprints[]` (colons optional; normalized to upper-hex).

```bash
curl -X POST .../origins -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"type":"domain","value":"example.com"}'
# -> 201 { "data": { "id": 9, "type": "domain", "value": "https://example.com", ... } }
```
A public host typed with `http://` is a `422` (the message tells you to use `https://`); a repeat is a
`409 ORIGIN_ALREADY_EXISTS`.

### `PATCH .../origins/{origin}`
Change `value` and/or the fingerprint lists. Type is immutable — change it by deleting and recreating.

### `DELETE .../origins/{origin}`
Remove one origin.

## Global origins

Origins an administrator has registered **platform-wide**: every restricted key accepts them in
addition to its own. Both endpoints are **read-only** and open to any valid token — writes stay in
the dashboard, because a global rule affects every project.

**Check here before you add an origin to a key.** An origin the platform already covers is a
duplicate that only adds noise.

### `GET /global-origins`
List every **active** global rule. Inactive rules are omitted, because they are invisible to
enforcement too. Each row carries the administrator's `note` — why that origin is trusted for every
key.

```bash
curl -s .../global-origins -H "Authorization: Bearer $TOKEN"
```
```json
{ "data": [ { "id": 4, "type": "domain", "value": "http://localhost:*",
              "sha256_fingerprints": null, "sha1_fingerprints": null,
              "note": "Local dev on any port, all projects", "created_at": "2026-07-18T..." } ] }
```

### `POST /global-origins/check`
Ask whether specific origins are **already covered**, and add only the ones that are not.

Use this rather than comparing the list yourself — matching is **not string equality**, and the
difference is not intuitive:

- `https://*.example.com` covers `https://app.example.com` **and** the bare apex `https://example.com`.
- `https://example.com` (an apex rule) covers **no** subdomain at all.
- `http://localhost:*` covers every port.

Body takes up to **50** candidates, each `type` + `value` — the same objects you would hand to
`POST .../origins`. An `android` candidate may add `cert_fingerprint` (the value the app sends as
`X-Android-Cert`), since a rule that pins signing certificates refuses the package without one.

```bash
curl -X POST .../global-origins/check -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"origins":[{"type":"domain","value":"app.example.com"},{"type":"domain","value":"https://app.zaions.com"}]}'
```
```json
{ "data": [
  { "type": "domain", "value": "app.example.com", "canonical_value": "https://app.example.com",
    "covered": true,  "matched_by": { "id": 3, "value": "https://*.example.com", "note": "…" } },
  { "type": "domain", "value": "https://app.zaions.com", "canonical_value": "https://app.zaions.com",
    "covered": false, "matched_by": null }
] }
```

Verdicts come back **one per candidate, in request order**, so you can zip them onto your own list.
`canonical_value` shows the normalisation (`example.com` → `https://example.com`) — the exact string
a browser sends and the exact string `POST .../origins` would store.

A value that can never be a legal origin is a **verdict, not an error**: you get `200` with
`covered: false` and a `reason`, so one typo does not discard the answers for every other candidate
in the batch — and the message is the same one `POST .../origins` would have refused it with.

| `reason.code` | Meaning |
| --- | --- |
| `INVALID_ORIGIN` | The value violates origin policy (e.g. `http://` on a public host), so it can never be covered. |
| `CERT_FINGERPRINT_REQUIRED` | A global rule allows this android package but pins certificates, and you sent no `cert_fingerprint`. |
| `CERT_FINGERPRINT_NOT_ALLOWED` | The package is pinned and the fingerprint you sent is not one of the pinned ones. |

These are verdict codes **inside a `200` body** — not HTTP errors, and not in the table below.

## Lookup

### `POST /api-keys/lookup`
Reverse-lookup an `fh_live_` key you found in a local `.env`. Body `{ "api_key": "fh_live_..." }`.
Returns the key's project, its safe representation, and its full origin list — or `404 NOT_FOUND` if
the key is unknown or outside this token's scope.

```json
{ "data": { "project": { "slug": "my-web-app", ... }, "api_key": { "restricted": true, ... }, "origins": [ { "type": "domain", "value": "https://myapp.com" } ] } }
```

## Supabase

Two separate surfaces, on two separate scopes, and neither returns the other's credential:

| Surface | Scope | Guide |
| --- | --- | --- |
| `GET`/`POST /supabase-projects…` — one project's keys, JWT secret, Postgres and S3 credentials | `can_manage_supabase` | **[Supabase project vault](./supabase-projects.md)** |
| `GET`/`POST /supabase-accounts…` — an account's personal access token (`sbp_…`) | `can_read_supabase_tokens` | **[Supabase account tokens](./supabase-accounts.md)** |

`can_manage_supabase` does **not** imply `can_read_supabase_tokens`: a project key reaches one project, an
account token reaches every project that account owns.

## Project vault

Every third-party credential, config file and identifier a project needs. Gated by **two** opt-in token
scopes — `can_read_vault` (metadata and presence flags) and `can_reveal_vault` (the values). Full guide:
**[Project vault](./project-vault.md)**.

### `GET /vault/services`
The field registry — every service, field, label, help text, `secret`, `client_safe` and `env_key`.
Schema discovery; any valid token may read it.

### `GET /vault/projects`
Projects with vault metadata. Query `q`, `status`, `per_page` (max 50), `page`.

### `GET /projects/{project}/vault`
One project **without secret values** — non-secret config plus `has` presence flags.

### `GET /projects/{project}/vault/{service}`
The same, narrowed to one service. Unknown service → `404`, listing the valid ones.

### `POST /projects/{project}/vault/reveal`
Every credential, plus `.env` blocks for `vite` / `next` / `node` / `laravel`, plus `undecryptable[]`.
Recorded against the project.

### `POST /projects/{project}/vault/{service}/reveal`
The same, narrowed to one service.

### `GET /projects/{project}/vault-files/{service}.{key}`
The real bytes of a stored config file, with its original filename and `X-Checksum-Sha256`.

## Error codes

| HTTP | `code` | When |
| --- | --- | --- |
| 401 | `MISSING_ACCESS_TOKEN`, `INVALID_ACCESS_TOKEN_FORMAT`, `INVALID_ACCESS_TOKEN`, `TOKEN_REVOKED`, `TOKEN_EXPIRED` | Auth (see [Authentication](./authentication.md)) |
| 403 | `TOKEN_PERMISSION_DENIED` | The token lacks a **scope** — `can_manage_supabase`, `can_read_vault`, `can_reveal_vault` or `can_read_supabase_tokens`. `details.required_scope` names it. Deliberately **not** a 404: a scope is a property of your own token, so there is nothing to enumerate |
| 404 | `NOT_FOUND` | Project / key / origin / service unknown **or** outside the token's scope |
| 409 | `ORIGIN_ALREADY_EXISTS`, `PLAINTEXT_UNAVAILABLE` | Duplicate origin; a stored value that cannot be decrypted (`details.reason`) |
| 422 | `VALIDATION_FAILED` | Bad body — `details` holds the per-field messages |
| 429 | — | Over 120 requests/minute |
