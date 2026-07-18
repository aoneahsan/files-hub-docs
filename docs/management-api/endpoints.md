---
sidebar_position: 3
title: Management API endpoints
description: Full endpoint reference for the FilesHub Public Management API — projects, API keys (create, rotate, reveal), origins, and reverse key lookup, with request and response examples.
keywords: [fileshub management api endpoints, create project api, create api key api, rotate api key, reveal api key, manage origins api, api-keys lookup, access token]
last_update:
  date: 2026-07-18
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
Create a key. Body: `name` (required); optional `can_read` / `can_write` / `can_send_emails` (default
true), `restricted` (default false), `email_daily_limit`, `rate_limit_per_minute`, `permissions`
object, `is_test`. **Returns the plaintext once:**
```json
{ "data": { "api_key": { "id": 7, "key_prefix": "fh_live_ab12", "restricted": false, ... }, "plaintext_key": "fh_live_ab12..." } }
```

### `GET /projects/{project}/api-keys/{apiKey}`
Fetch one key (safe representation).

### `PATCH /projects/{project}/api-keys/{apiKey}`
Update `name`, the `can_*` flags, `restricted`, limits, `permissions`, or `is_active`. Turning
`restricted` on with no origins denies every request — add origins first (below).

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

## Lookup

### `POST /api-keys/lookup`
Reverse-lookup an `fh_live_` key you found in a local `.env`. Body `{ "api_key": "fh_live_..." }`.
Returns the key's project, its safe representation, and its full origin list — or `404 NOT_FOUND` if
the key is unknown or outside this token's scope.

```json
{ "data": { "project": { "slug": "my-web-app", ... }, "api_key": { "restricted": true, ... }, "origins": [ { "type": "domain", "value": "https://myapp.com" } ] } }
```

## Error codes

| HTTP | `code` | When |
| --- | --- | --- |
| 401 | `MISSING_ACCESS_TOKEN`, `INVALID_ACCESS_TOKEN_FORMAT`, `INVALID_ACCESS_TOKEN`, `TOKEN_REVOKED`, `TOKEN_EXPIRED` | Auth (see [Authentication](./authentication.md)) |
| 404 | `NOT_FOUND` | Project / key / origin unknown **or** outside the token's scope |
| 409 | `ORIGIN_ALREADY_EXISTS`, `PLAINTEXT_UNAVAILABLE` | Duplicate origin; legacy key has no stored plaintext |
| 422 | `VALIDATION_FAILED` | Bad body — `details` holds the per-field messages |
| 429 | — | Over 120 requests/minute |
