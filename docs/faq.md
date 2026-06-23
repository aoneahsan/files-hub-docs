---
sidebar_position: 5
title: FAQ
description: Frequently asked questions about FilesHub — what it is, how to authenticate, public vs private files, size limits, SDKs, deleting files, and how it compares to S3 or Firebase Storage.
keywords: [fileshub faq, file storage api faq, x-api-key, public private files, upload size limit, fileshub vs s3, fileshub vs firebase storage]
last_update:
  date: 2026-06-23
  author: Ahsan Mahmood
---

# FAQ

### What is FilesHub?

FilesHub is a zero-cost file-storage and developer-utility API. You upload a file over HTTP with an `X-API-Key` header and get back a stable URL; you can also list, download, and delete objects, set per-file visibility, and call 50+ utility endpoints on the same base URL.

### How do I authenticate?

Send `X-API-Key: <your project key>` on every request. Keys are created per project in the Nova admin panel and carry `read`/`write` permissions plus optional origin/app restrictions. See [Authentication](getting-started/authentication).

### Do I need an SDK?

No. FilesHub is plain HTTP, so `curl`, `fetch`, `axios`, Guzzle, or any HTTP client in any language works. There is no published client SDK package yet (a TypeScript SDK is archived until the API stabilises) — every example in these docs uses raw HTTP.

### What's the difference between public and private files?

`public` objects are downloadable by anyone who has the URL — render them directly in an `<img>`/`<a>`. `private` objects require a `read`-permission key from the same project, so your server fetches and streams them to authorised users. The integration default across Aoneahsan/Zaions apps is `public`. See [File visibility](getting-started/file-visibility).

### Is a public file URL guessable?

No. The URL contains a ULID `public_id`, which is unguessable and not enumerable by outsiders — listing requires a `read` key. "Public" means anyone with the link can open it, like an unlisted link.

### How big can an upload be?

The default cap is 10 MB, configurable per deployment via `FILESHUB_MAX_UPLOAD_MB`. Larger uploads fail validation with `422`. FilesHub is built for app assets, user uploads, exports, and share links rather than large-media streaming.

### How do I make files auto-delete?

Send `expires_in_days` (1–3650) or an absolute `expires_at` (ISO-8601) on upload. The object is treated as gone after its expiry and is cleaned up when next accessed. Handy for one-time exports or temporary share links.

### How do I avoid orphaned files?

Pair every upload with a delete: when you remove the record that owned a file, call `DELETE /api/v1/objects/{public_id}`. Deleting an object removes both the database record and the stored bytes. See [Delete an object](api/delete-object).

### Can I upload directly from the browser or a mobile app?

Yes — use a restricted key scoped to your domain (`Origin`/`Referer`) or your bundle id (`X-App-Id`), or proxy uploads through your own backend so the key never reaches the client. See [Browser & mobile uploads](guides/browser-and-mobile-uploads).

### How is FilesHub different from S3 or Firebase Storage?

S3 and Firebase Storage are cloud object stores with their own SDKs, IAM, and (usage-based) billing. FilesHub is a single, self-hostable HTTP service with one `X-API-Key`, per-file visibility, optional auto-expiry, and a bundle of developer utilities — designed to be the zero-cost upload backend for many small apps at once. It is single-region and locally stored, so for global edge delivery of large media you would still put a CDN in front.

### Is FilesHub free?

Yes. It is the zero-cost storage backend used across the Aoneahsan/Zaions projects. Run your own instance or use the hosted one at [fileshub.zaions.com](https://fileshub.zaions.com).

### Where do I report a bug or security issue?

Email [aoneahsan@gmail.com](mailto:aoneahsan@gmail.com). For security reports, see the disclosure policy in [`/.well-known/security.txt`](https://docs.fileshub.zaions.com/.well-known/security.txt).
