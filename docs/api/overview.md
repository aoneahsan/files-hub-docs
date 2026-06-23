---
sidebar_position: 1
title: API overview
description: The FilesHub object API is four HTTP endpoints under /api/v1 — upload, download, list, and delete — all authenticated with an X-API-Key header. This page summarises the contract.
keywords: [fileshub api, object api, rest file api, /api/v1/objects, upload download delete api, x-api-key]
last_update:
  date: 2026-06-23
  author: Ahsan Mahmood
---

# API overview

**The FilesHub object API is four endpoints under `/api/v1` — upload, download, list, and delete — each authenticated with an `X-API-Key` header.** This is the surface every app integrates first; the wider [platform services](../platform-services) (hashing, QR codes, converters, and more) share the same base URL and key.

## Base URL

```
https://fileshub.zaions.com/api/v1
```

## Authentication

Send `X-API-Key: <key>` on every request. Keys are per project with `read`/`write` permissions and optional origin/app restrictions — see [Authentication](../getting-started/authentication).

## Object endpoints

| Method | Path | Permission | Purpose |
|---|---|---|---|
| `POST` | `/objects` | `write` | [Upload an object](upload-object) (multipart `file`). |
| `GET` | `/objects/{public_id}` | none (public) / `read` (private) | [Download / view an object](get-object) (streams the file). |
| `GET` | `/objects` | `read` | [List objects](list-objects) (paginated). |
| `DELETE` | `/objects/{public_id}` | `write` | [Delete an object](delete-object). |

There is also a public health check:

```
GET /api/v1/health   →   200 (no key required)
```

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
