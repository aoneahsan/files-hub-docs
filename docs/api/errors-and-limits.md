---
sidebar_position: 6
title: Errors & limits
description: FilesHub returns a consistent JSON error envelope with an HTTP status code, and applies per-key rate limits and an upload size cap. This page lists every status code and limit.
keywords: [fileshub errors, api error codes, rate limit, 429, upload size limit, http status codes, error envelope]
last_update:
  date: 2026-08-04
  author: Ahsan Mahmood
---

# Errors & limits

This page covers the **v1 data plane** (`/api/v1/*`, authenticated with `X-API-Key`) — objects, email, jobs
and the utilities. The Management plane answers differently; see [Two planes, two
envelopes](#two-planes-two-envelopes) below.

## Error envelope

Failed requests return a JSON body with a human-readable `message` and the relevant HTTP status code:

```json
{ "message": "This object is private. Provide a valid API key with read permission." }
```

For validation failures (`422`), `message` is the first validation error (e.g. `"The file failed to upload."`).

There is **no machine-readable `code`** on this plane — branch on the HTTP status.

## Two planes, two envelopes

Do not reuse one parser for both. The Management plane (`/api/public/v1/*`, authenticated with an `fh_pat_`
access token) wraps every failure in a coded object instead:

```json
{ "error": { "code": "TOKEN_PERMISSION_DENIED",
             "message": "This access token cannot reveal vault credentials...",
             "details": { "required_scope": "can_reveal_vault" } } }
```

| | v1 data plane | Management plane |
|---|---|---|
| Auth | `X-API-Key: fh_live_...` | `Authorization: Bearer fh_pat_...` |
| Error body | `{ "message": "..." }` | `{ "error": { "code", "message", "details"? } }` |
| Machine-readable code | no | **yes** — branch on `code` |
| Rate limit | per-key, configurable | fixed **120 requests/minute** per token |
| CORS | enabled | **none** — server and CLI only |

`details` is present only on the codes that carry one, and is absent rather than `null` otherwise. The full
code table lives with the endpoints it belongs to:
**[Management API error codes](../management-api/endpoints.md#error-codes)**.

## Status codes

| Status | Meaning | Common cause |
|---|---|---|
| `200 OK` | Success. | List, download, delete. |
| `201 Created` | Object stored. | Upload. |
| `401 Unauthorized` | Missing/invalid key, or a private object requested without a key. | No `X-API-Key`, wrong key. |
| `403 Forbidden` | Authenticated but not allowed. | Key lacks `read`/`write`, or origin/app-id not allowed. |
| `404 Not Found` | Resource absent. | Unknown/expired `public_id`, cross-project access, or stored file missing. |
| `422 Unprocessable Entity` | Validation failed. | No file, file too large, bad `visibility`, disallowed MIME, bad query param. |
| `429 Too Many Requests` | Rate limit exceeded. | Too many requests on one key. |
| `500 Internal Server Error` | Server-side failure. | Storage/IO error. |

## Rate limiting

Each API key has a configurable per-minute request limit. Exceeding it returns `429`. Build a small retry/backoff into batch jobs and avoid hammering the upload endpoint in tight loops. (Exact limits depend on the deployment's configuration.)

The Management plane is different: a flat **120 requests/minute** per access token, not configurable per key.

## Upload size

The maximum upload size is configured per deployment via `FILESHUB_MAX_UPLOAD_MB` (default **10 MB**). Uploads over the cap fail validation with `422`. For optimal performance keep individual files small; FilesHub is built for app assets, user uploads, exports, and share links rather than large media streaming.

## Allowed file types

By default all MIME types are accepted and detected automatically. A deployment may configure an allowed-MIME list; if it does, uploads outside that list fail with `422`. Check with your FilesHub maintainer if you hit unexpected `422`s on a valid file.

## Handling errors well

- Treat any non-`2xx` as a failure and read `message` for the reason.
- On `401`/`403`, check the key, its permissions, and (for restricted keys) the origin/`X-App-Id`.
- On `429`, back off and retry.
- On `422`, surface `message` to the user — it explains exactly what was wrong with the upload.
