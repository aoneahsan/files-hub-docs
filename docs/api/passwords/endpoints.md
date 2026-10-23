---
sidebar_position: 3
title: Password manager — endpoint reference
sidebar_label: Endpoint reference
description: Every /api/v1/passwords endpoint — list, create, get, update, delete, restore, reveal and generate — with parameters, the ability each needs, request and response examples, and every error.
keywords: [fileshub password api reference, GET /api/v1/passwords, POST /api/v1/passwords, reveal password endpoint, generate password api, restore deleted password api]
last_update:
  date: 2026-10-23
  author: FilesHub team
---

# Endpoint reference

Base URL `https://fileshub.zaions.com/api/v1`, header `X-API-Key: fh_live_…`, JSON in and out. Every route
needs a key with a password scope (`own` or `admin`) **and** the ability listed. Which entries a key reaches
is explained in [Access and scopes](./access-and-scopes.md). The machine-readable version is in the
[OpenAPI document](https://fileshub-docs.zaions.com/openapi.json) under the `Passwords` tag.

| Method | Path | Ability | Purpose |
|---|---|---|---|
| `GET` | [`/passwords`](#list) | `list` | Search and list entries |
| `POST` | [`/passwords`](#create) | `create` | Save a new entry |
| `GET` | [`/passwords/{id}`](#get) | `list` | One entry's details |
| `PATCH` | [`/passwords/{id}`](#update) | `update` | Change any field |
| `POST` | [`/passwords/{id}/reveal`](#reveal) | `reveal` | The password, current code and history |
| `DELETE` | [`/passwords/{id}`](#delete) | `delete` | To Recently Deleted, or remove for good |
| `POST` | [`/passwords/{id}/restore`](#restore) | `delete` | Back from Recently Deleted |
| `POST` | [`/passwords/generate`](#generate) | `create` or `update` | A strong password (stores nothing) |

## The entry object

Every answer except reveal and generate returns this shape. It **never** contains the password, the setup
key or the history.

```json
{
  "id": "01m5mjhqhzm44rckzkca0anxf0",
  "project_id": 1,
  "title": "Domain registrar",
  "websites": ["https://registrar.example.com", "https://registrar.example.com/login"],
  "username": "ops@acme.test",
  "notes": "Renews every March.",
  "tags": ["domains", "billing"],
  "is_favorite": true,
  "has_verification_code": true,
  "strength": { "score": 4, "label": "very strong" },
  "reused": false,
  "owner_scope": "admin",
  "created_via": "api",
  "password_changed_at": "2026-10-23T14:27:28+00:00",
  "last_revealed_at": null,
  "created_at": "2026-10-23T14:27:28+00:00",
  "updated_at": "2026-10-23T14:27:28+00:00",
  "deleted_at": null
}
```

Field meanings: [Overview → What an entry holds](./overview.md#what-an-entry-holds). `reused` is `null` in
lists and restore answers; ask for one entry to get it.

## List {#list}

`GET /passwords` — the entries this key can reach, favourites first, then by title.

| Query | Meaning |
|---|---|
| `q` | Text in the title, username or websites. |
| `website` | A host or URL; matches entries saved for that host (`registrar.example.com`). |
| `tag` | Entries carrying this tag. |
| `favorite` | `1` for favourites only, `0` for the rest. |
| `trashed` | `only` lists Recently Deleted instead. |
| `project_id` | **Every-project admin keys only:** one project. Ignored for other keys. |
| `page`, `per_page` | Paging: default 20, maximum 50 ([pagination](../pagination.md)). |

```bash
curl -s "https://fileshub.zaions.com/api/v1/passwords?q=registrar&per_page=20" -H "X-API-Key: $FILESHUB_KEY"
```

```json
{
  "success": true,
  "data": [ { "id": "01m5mjhqhzm44rckzkca0anxf0", "title": "Domain registrar", "...": "the entry object" } ],
  "meta": { "current_page": 1, "per_page": 20, "total": 1, "last_page": 1, "has_more": false, "next_page": null },
  "message": "Showing 1-1 of 1 (page 1 of 1). This is the last page."
}
```

## Create {#create}

`POST /passwords` → `201` with the entry.

| Body field | Rules |
|---|---|
| `title` | **Required.** String, ≤ 191. |
| `password` | **Required.** String, ≤ 1,024. |
| `websites` | List of up to 20 strings (`example.com`, `https://example.com/login`). |
| `username` | String, ≤ 191. |
| `totp_secret` | Base32 setup key (at least 16 characters, spaces allowed) or an `otpauth://totp/…?secret=…` link. |
| `notes` | String, ≤ 10,000. |
| `tags` | List of up to 20 strings, each ≤ 40. |
| `is_favorite` | Boolean. |
| `project_id` | **Every-project admin keys only:** store it in another project (its numeric id). Any other key may send only its own project's id. |

The new entry's owner follows the key: an `own` key's entries are `owner_scope: "own"`, an `admin` key's are
`"admin"`.

```bash
curl -s https://fileshub.zaions.com/api/v1/passwords \
  -H "X-API-Key: $FILESHUB_KEY" -H "Content-Type: application/json" \
  -d '{"title": "Domain registrar", "websites": ["registrar.example.com"], "username": "ops@acme.test", "password": "vKpqzt-mbw4hd-Xenfra"}'
```

## Get {#get}

`GET /passwords/{id}` → `200` with the entry, including `reused`.

## Update {#update}

`PATCH /passwords/{id}` → `200` with the entry. Send only what changes; every create field except
`project_id` is accepted. Send `"totp_secret": null` to remove a setup key.

A new `password` moves the current one into the history (the last 10 are kept), re-scores the strength and
sets `password_changed_at`. Sending the same password again changes nothing.

```bash
curl -s -X PATCH https://fileshub.zaions.com/api/v1/passwords/01m5mjhqhzm44rckzkca0anxf0 \
  -H "X-API-Key: $FILESHUB_KEY" -H "Content-Type: application/json" \
  -d '{"password": "Hqtrnw-5fmzky-pobcse", "tags": ["domains"]}'
```

## Reveal {#reveal}

`POST /passwords/{id}/reveal` → `200`. Body (optional): `{"history": true}` adds the earlier passwords.
Sets `last_revealed_at` and writes an audit-log row.

```json
{
  "data": {
    "id": "01m5mjhqhzm44rckzkca0anxf0",
    "username": "ops@acme.test",
    "password": "Hqtrnw-5fmzky-pobcse",
    "unreadable": false,
    "verification_code": { "code": "626093", "expires_in": 21 },
    "password_history": [
      { "password": "vKpqzt-mbw4hd-Xenfra", "replaced_at": "2026-10-23T14:27:28+00:00" }
    ]
  }
}
```

- `verification_code` is `null` when no setup key is stored. Codes are the standard 30-second, 6-digit
  (RFC 6238, SHA-1) codes; `expires_in` is the seconds left. Ask again for the next one.
- `password_history` is `null` unless `history` was requested; newest first.
- `unreadable: true` with `password: null` means the stored value can no longer be decrypted.

## Delete {#delete}

`DELETE /passwords/{id}` → `200 {"data": {"id": "…", "deleted": true}}`. The entry moves to Recently Deleted:
it disappears from lists and lookups, and `GET /passwords?trashed=only` shows it.

`DELETE /passwords/{id}?permanent=1` on an entry **already in Recently Deleted** removes it for good →
`200 {"data": {"id": "…", "purged": true}}`. On a live entry it answers `409` and changes nothing:

```json
{ "message": "Delete the password first; only a deleted password can be removed for good." }
```

## Restore {#restore}

`POST /passwords/{id}/restore` → `200` with the entry, back in place. Restoring a live entry is a no-op.

## Generate {#generate}

`POST /passwords/generate` → `200`. Stores nothing.

| Body field | Meaning |
|---|---|
| `style` | `grouped` (default): three groups of six, one digit and one capital, like `Fneuht-fguhgh-s3bitk`. `random`: random characters. |
| `length` | `random` only: 8–128, default 20. |
| `symbols`, `numbers`, `uppercase` | `random` only: booleans, default `true`. |

```json
{ "data": { "password": "W4_zyv24KafLFlUu<zIo4epC", "strength": "very strong" } }
```

## Errors

Errors answer `{"message": "…"}`; validation errors add `errors`.

| Status | When | Example `message` |
|---|---|---|
| `401` | No key, a wrong key or a disabled key | `API key missing` · `Invalid API key` · `API key is inactive` |
| `402` | An external project with no plan for the password manager | `This project has no active plan for passwords. See https://fileshub.zaions.com/pricing to request it.` |
| `403` | The key has no password scope | `Insufficient permissions. Required scope: passwords` |
| `403` | The scope lacks the ability | `This key lacks the password ability: reveal.` |
| `403` | Creating in another project without every-project reach | `This key can only store passwords in its own project.` |
| `404` | The id does not exist **or** the key cannot reach it | `Not found` |
| `409` | Permanent removal of a live entry | `Delete the password first; only a deleted password can be removed for good.` |
| `422` | Invalid input | `The password field is required.` · `The verification code setup key must be a base32 key or an otpauth:// link.` |
| `429` | The key's rate limit (default 60 requests a minute) | See [errors and limits](../errors-and-limits.md) |
