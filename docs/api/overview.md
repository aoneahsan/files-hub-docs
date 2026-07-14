---
sidebar_position: 1
title: API overview
description: The FilesHub API under /api/v1 covers file objects, transactional email, jobs, and 40+ developer utilities — all authenticated with an X-API-Key header. This page maps the contract.
keywords: [fileshub api, object api, email api, rest file api, /api/v1/objects, upload download delete api, x-api-key, api scopes]
last_update:
  date: 2026-07-14
  author: Ahsan Mahmood
---

# API overview

**The FilesHub API lives under `/api/v1` and is authenticated with an `X-API-Key` header.** File objects are the surface most apps integrate first, but the same base URL and key also cover transactional [email](emails-send), background [jobs](jobs), and 40+ [developer utilities](utilities-index).

## Base URL

```
https://fileshub.zaions.com/api/v1
```

Two status endpoints live one level up, at `/api` (not `/api/v1`): [`/health` and `/version`](version-health).

## Authentication & scopes

Send `X-API-Key: <key>` on every request. A key is per project and carries scopes:

| Scope | Grants |
|---|---|
| `read` | List and read (download private objects, list jobs/templates/schedules). |
| `write` | Create and delete (upload, delete, manage schedules/templates). |
| `email` | Send email (`can_send_emails`). |
| `email_template` | Manage email templates (with `write`). |
| service scopes | Per-utility access (e.g. `converter`, `qr_code`) — all enabled by default. |

Keys can also be **restricted** to your own web origins or apps so you can ship one in a frontend — see [Authentication](../getting-started/authentication) and [API key restrictions](../getting-started/api-key-restrictions).

## Object endpoints

| Method | Path | Permission | Purpose |
|---|---|---|---|
| `POST` | `/objects` | `write` | [Upload an object](upload-object) (multipart `file`). |
| `GET` | `/objects/{public_id}` | none (public) / `read` (private) | [Download / view an object](get-object) (streams the file). |
| `GET` | `/objects` | `read` | [List objects](list-objects) (paginated). |
| `DELETE` | `/objects/{public_id}` | `write` | [Delete an object](delete-object). |

## Email endpoints

| Method | Path | Permission | Purpose |
|---|---|---|---|
| `POST` | `/emails/send` | `email` | [Send an email](emails-send) (raw or template; queued by default). |
| `GET` | `/emails/templates` | `read` | [List templates](email-templates). |
| `POST`/`PATCH`/`DELETE` | `/emails/templates{/slug}` | `write` + `email_template` | [Manage templates](email-templates). |
| `GET`/`POST`/`PATCH`/`DELETE` | `/email-schedules{/id}` | `read`/`write` | [Recurring schedules](email-schedules). |
| `POST` | `/email-schedules/{id}/run` | `write` | Run a schedule now. |

## Jobs & status

| Method | Path | Permission | Purpose |
|---|---|---|---|
| `GET` | `/jobs` · `/jobs/{job_id}` | `read` | [Poll queued operations](jobs). |
| `GET` | `/api/health` | none | [Health check](version-health) (no key). |
| `GET` | `/api/version` | none | [Deploy-version marker](version-health) (no key). |

Beyond these, 40+ stateless [developer utilities](utilities-index) and the stateful [platform services](../platform-services) share the same base URL and key.

## The object shape

An object returned by the API has these fields (exact set varies by endpoint):

| Field | Type | Notes |
|---|---|---|
| `public_id` | string (ULID) | Stable, URL-safe, sortable id. Used in the object URL. |
| `project_id` | string (ULID) | The owning project's public id. |
| `original_filename` | string | The filename you uploaded. |
| `mime_type` | string | Detected on upload (e.g. `image/png`). |
| `size_bytes` | integer | File size in bytes. |
| `visibility` | `public` \| `private` | Access control — see [File visibility](../getting-started/file-visibility). |
| `url` | string | The full download/view URL for the object. |
| `expires_at` | string (ISO-8601) \| `null` | When the object auto-deletes, if an expiry was set. |
| `created_at` | string (ISO-8601) | Upload time (returned by the list endpoint). |

## Conventions

- **Content type** — uploads are `multipart/form-data`; all JSON responses are `application/json`.
- **Identifiers** — objects are addressed by their ULID `public_id`, never by an internal numeric id.
- **Errors** — failures return `{ "message": "..." }` with an appropriate status code. See [Errors & limits](errors-and-limits).
- **Versioning** — the path is versioned (`/api/v1`); future breaking changes ship under `/api/v2`.

Read the per-endpoint pages for exact parameters, examples, and every response and error body.

## Machine-readable

- **[OpenAPI 3.1 spec](openapi)** — [`/openapi.json`](https://fileshub-docs.zaions.com/openapi.json) covers objects, emails, jobs, schedules, templates, and version/health for AI agents and codegen.
- **Raw Markdown** — every doc page is mirrored under `/raw/` (index: [`/raw/manifest.json`](https://fileshub-docs.zaions.com/raw/manifest.json)) so an agent can load the docs into its context.
