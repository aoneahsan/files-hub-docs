---
sidebar_position: 3
title: Management API endpoints
description: Full endpoint reference for the FilesHub Public Management API — projects, API keys (create, rotate, reveal), origins, global origins, and reverse key lookup, with request and response examples.
keywords: [fileshub management api endpoints, create project api, create api key api, rotate api key, reveal api key, manage origins api, global origins api, api-keys lookup, access token]
last_update:
  date: 2026-08-19
  author: Ahsan Mahmood
---

# Endpoint reference

Base URL `https://fileshub.zaions.com/api/public/v1`. Every request needs
`Authorization: Bearer fh_pat_...` (see [Authentication](./authentication.md)).

Success is always `{"data": ...}`; failure is always `{"error": {"code", "message", "details"?}}`. Most lists
are paginated and add `meta` + `message` — see [Pagination](../api/pagination.md) for the full contract and
the three deliberately unpaginated exceptions.

The machine spec is [`openapi.json`](https://fileshub-docs.zaions.com/openapi.json). It is **hand-maintained,
not generated**, so where it and the running API disagree the API is right — please report the divergence.

## Token

### `GET /token`
Introspect the current token — name, `token_prefix`, expiry, last use, and the four capability booleans
(`can_manage_supabase`, `can_read_vault`, `can_reveal_vault`, `can_read_supabase_tokens`), **all off by
default**. The intended first call: it turns a later `403` into something you predicted.

`projects[]` appears **only when `all_projects` is `false`**. On an all-projects token the key is absent
entirely — not `null`, not `[]` — because such a token also covers projects that do not exist yet, so no
list could describe it. Test with `'projects' in data`. Full detail: [Authentication](./authentication.md).

## Projects

A project carries more than a name. Alongside `id` / `public_id` / `name` / `slug` / `status` / `notes` /
`created_at`, every read returns **`description`**, **`app_identifier`**, **`primary_url`**, **`repo_url`**,
**`repo_is_public`**, **`platforms[]`** and **`tech_stack[]`** — and all seven are writable on create and
update. `platforms` and `tech_stack` are always arrays, empty rather than `null`.

:::note One field is not yours to change later
`app_identifier` is the reverse-DNS app id. It is **immutable once the app is published to a store** —
changing it orphans every existing install. The API will accept the write; the store will not forgive it.
:::

### `GET /projects`
List the projects this token may manage. Query: `q` (substring match on name or slug), `status`
(`active` / `inactive`), `per_page`, `page`. Each item includes `api_keys_count`.

### `POST /projects`
Create a project. Body: `name` (required, ≤255) plus any of `slug`, `status` (`active` default), `notes`,
`description`, `app_identifier`, `primary_url`, `repo_url`, `repo_is_public`, `platforms[]`,
`tech_stack[]`.

`slug` accepts lowercase letters, digits and hyphens only. **Omit it and a unique one is generated from the
name; supply one and it is used verbatim** — so a duplicate comes back as `409 SLUG_ALREADY_EXISTS` rather
than being quietly de-duplicated for you.

```bash
curl -X POST .../projects -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"My Web App"}'
```
```json
{ "data": { "id": 42, "public_id": "01KX...", "name": "My Web App", "slug": "my-web-app",
            "status": "active", "notes": null, "description": null, "app_identifier": null,
            "primary_url": null, "repo_url": null, "repo_is_public": null,
            "platforms": [], "tech_stack": [], "created_at": "2026-07-18T..." } }
```

A token scoped to specific projects is **attached to the project it just created**, so its next call to that
project resolves instead of 404-ing.

### `GET /projects/{project}`
Fetch one project by **numeric id, ULID `public_id`, or slug**. Adds an abbreviated `api_keys` list —
`id`, `name`, `key_prefix`, `restricted`, `is_active` per key, newest first. For the full key representation
call the api-keys endpoints below.

### `PATCH /projects/{project}`
Update any of the project's own fields. Send only what you are changing; an omitted key is left alone.
`platforms`, `tech_stack` and `permissions` **replace** rather than merge. Unlike on create, `slug` does not
accept `null` here — omit it to leave the slug alone. A duplicate slug is `409 SLUG_ALREADY_EXISTS`.

Since `2026.08.19.1` this also accepts **`supabase_project_id`** — the registered Supabase project this app
uses. Worth writing back the first time you resolve it, so the next session reads a stored fact instead of
re-deriving one from a committed `.env` and a name match. Two conditions: the token needs
`can_manage_supabase`, and the target must be a Supabase project it could already see — linking widens what
the token may read, so the write is gated by the same rule as the read (`422` otherwise).

Credential **values** are still not writable here, and no endpoint for that is planned — see
[Project vault](./project-vault.md).

### `DELETE /projects/{project}`

:::danger This destroys the project's entire credential vault

The cascade is wider than it looks: API keys, origins, stored objects and audit logs — **and** every stored
credential, every stored config file, every project link and the whole reveal trail. Nothing here is
recoverable, and the vault rows are the least recoverable part.

Until `2026.08.19.1` the response named only `api_keys` and `stored_objects`, so the credentials went
unmentioned, and this was the one write on the plane that left **no audit row at all**. Both are fixed: all
six counts come back, and the call is recorded as `public_api.project.deleted` with those counts in its
metadata — written *before* the delete, because the audit row's own `project_id` cascades too.
:::

```json
{ "data": { "deleted": true, "cascade": {
    "api_keys": 3, "stored_objects": 128,
    "vault_credentials": 11, "vault_files": 2, "links": 4, "vault_reveals": 7 } } }
```

## API keys

`{project}` accepts an id, `public_id`, or slug; `{apiKey}` is the numeric key id. The safe
representation never includes the hash or plaintext — the secret is returned **only** by create,
rotate, and reveal.

### `GET /projects/{project}/api-keys`
List the project's keys, newest first (prefix, permissions, `restricted`, `is_active`, `origins_count`).
**Paginated** — `per_page` (default 20, max 50) and `page`, with the usual `meta` and `message`. Rotating
and deleting leaves the old rows in place, so a long-lived project accumulates keys without limit: loop on
`meta.has_more` rather than assuming one call returned them all.

:::caution `remaining_items` past the last page

Before `2026.08.19.1` a request for a page beyond the end answered `has_more: false` **and**
`remaining_items: <the whole total>` in the same object — two keys contradicting each other, and a loop that
decided whether to keep paging from `remaining_items` never terminated. It reports `0` now. Against an older
deploy, trust `has_more` / `next_page`.
:::

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
Delete a key; its origins cascade, and the count comes back as
`{ "deleted": true, "cascade": { "origins": 2 } }`. To stop a key working while keeping its record, prefer
`PATCH { "is_active": false }`.

:::note There is no `revoke`, `deprecate` or `restrictions` endpoint
All three return `404`. Deactivating is `PATCH { "is_active": false }`; restricting is
`PATCH { "restricted": true }` plus the origins sub-resource. Those verbs belong to a *different* product's
management API and are easy to conflate with this one.
:::

### `POST /projects/{project}/api-keys/{apiKey}/rotate`
Issue a new secret. The old key stops working **immediately** — update every consumer in the same change.
Returns the key's fields plus the new `plaintext_key`.

### `POST /projects/{project}/api-keys/{apiKey}/reveal`
Re-read the stored plaintext for a key you already created. The response is **only**
`{ "plaintext_key": "fh_live_..." }` — not the key's other fields; `GET` the key for those.

Two different causes share `409 PLAINTEXT_UNAVAILABLE`, told apart by `details.reason`:

| `reason` | Meaning | Remedy |
| --- | --- | --- |
| `not_retained` | The key predates plaintext retention — nothing is stored. | Rotate. |
| `undecryptable` | A value **is** stored but was encrypted under a different `APP_KEY`. | Rotate. |

The remedy is the same, which is why they share a status; the distinction exists so an operator can tell a
historical gap from a key-management problem.

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

:::warning These endpoints are live; the data is not
As of 2026-08-04 **no registered project has any configured service**, so a reveal returns the empty
skeleton. An empty service means *not entered*, never *not applicable*. The
[Project vault](./project-vault.md) page explains what that does and does not let you conclude.
:::

### `GET /vault/services`
The field registry — every service, field, label, help text, `secret`, `client_safe` and `env_key`. Schema
discovery: **any valid token may read it, with no vault scope at all**, because it describes the shape of the
vault and never its contents. It is the one vault endpoint that cannot return `403`.

### `GET /vault/projects`
Projects with vault metadata. Query `q` (name / slug / app identifier), `status`, `per_page` (max 50), `page`.

### `GET /projects/{project}/vault`
One project **without secret values** — non-secret config plus `has` presence flags.

### `GET /projects/{project}/vault/{service}`
The same, narrowed to one service. Unknown service → `404`, listing the valid ones.

### `POST /projects/{project}/vault/reveal`
Every credential, plus `.env` blocks for `vite` / `next` / `node` / `laravel`, plus `undecryptable[]`.
Recorded against the project. **A block that would be empty is dropped**, so `env` can be `{}`.

### `POST /projects/{project}/vault/{service}/reveal`
The same, narrowed to one service.

### `GET /projects/{project}/vault-files/{service}.{key}`
The real bytes of a stored config file, with its original filename, `Content-Disposition`,
`Content-Length` and `X-Checksum-Sha256`. Note the path segment is **`vault-files`**, not `vault/files` —
the latter would be ambiguous with `vault/{service}/reveal`.

## Error codes

Every failure on this plane uses one envelope — `{"error": {"code", "message", "details"?}}`. Branch on
`code`, never on the message text. (The v1 data plane is different: a bare `{"message": "..."}` with no
code — see [Errors & limits](../api/errors-and-limits.md).)

| HTTP | `code` | When |
| --- | --- | --- |
| 401 | `MISSING_ACCESS_TOKEN`, `INVALID_ACCESS_TOKEN_FORMAT`, `INVALID_ACCESS_TOKEN`, `TOKEN_REVOKED`, `TOKEN_EXPIRED` | Auth (see [Authentication](./authentication.md)) |
| 403 | `TOKEN_PERMISSION_DENIED` | The token lacks a **scope**; `details.required_scope` names it (values below). Deliberately **not** a 404: a scope is a property of your own token, so there is nothing to enumerate |
| 403 | `FORBIDDEN` | The action is not allowed for this token |
| 404 | `NOT_FOUND` | Project / key / origin / account / service unknown **or** outside the token's scope |
| 409 | `SLUG_ALREADY_EXISTS` | A project slug you supplied is taken |
| 409 | `ORIGIN_ALREADY_EXISTS` | That key already has an origin with the same type and value |
| 409 | `PLAINTEXT_UNAVAILABLE` | A secret cannot be handed back; `details.reason` is `not_retained` or `undecryptable` |
| 422 | `VALIDATION_FAILED` | Bad body — `details` holds the per-field messages |
| 429 | — | Over **120 requests/minute** per token. This plane's limit is fixed, unlike the per-key limit on the data plane |

`details` is **absent** when a code does not carry one — never `null`.

### `details.required_scope` — match on both forms

The value is not uniform yet, so read it defensively:

| Gate | What it returns |
| --- | --- |
| Project vault read | `can_read_vault` |
| Project vault reveal | `can_reveal_vault` |
| Supabase **project** vault | `can_manage_supabase` |
| Supabase **account** token | `can_read_supabase_tokens` |

All four now report the token's own column name, so the 403 names the switch to enable in Nova.

:::note Older releases returned two shorter labels
Before `2026.08.04.1` (deployed 2026-08-04) the Supabase pair reported `supabase_projects` and
`supabase_tokens`, which matched no column and no Nova field. **Accepting all six strings** costs nothing and
survives either release. Verify which is live with `curl -s https://fileshub.zaions.com/api/version` rather
than inferring it from a document — including this one.
:::
