---
sidebar_position: 6
title: Errors & limits
description: FilesHub returns a consistent JSON error envelope with an HTTP status code, and applies per-key rate limits and an upload size cap. This page lists every status code and limit.
keywords: [fileshub errors, api error codes, rate limit, 429, upload size limit, http status codes, error envelope]
last_update:
  date: 2026-06-23
  author: Ahsan Mahmood
---

# Errors & limits

## Error envelope

Failed requests return a JSON body with a human-readable `message` and the relevant HTTP status code:

```json
{ "message": "This object is private. Provide a valid API key with read permission." }
```

For validation failures (`422`), `message` is the first validation error (e.g. `"The file failed to upload."`).

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

## Upload size

The maximum upload size is configured per deployment via `FILESHUB_MAX_UPLOAD_MB` (default **10 MB**). Uploads over the cap fail validation with `422`. For optimal performance keep individual files small; FilesHub is built for app assets, user uploads, exports, and share links rather than large media streaming.

## Allowed file types

By default all MIME types are accepted and detected automatically. A deployment may configure an allowed-MIME list; if it does, uploads outside that list fail with `422`. Check with your FilesHub maintainer if you hit unexpected `422`s on a valid file.

## Handling errors well

- Treat any non-`2xx` as a failure and read `message` for the reason.
- On `401`/`403`, check the key, its permissions, and (for restricted keys) the origin/`X-App-Id`.
- On `429`, back off and retry.
- On `422`, surface `message` to the user — it explains exactly what was wrong with the upload.
