---
sidebar_position: 1
title: Quick Start
description: Upload your first file to FilesHub in about five minutes — get an API key, POST a multipart file with your X-API-Key, and use the returned public URL.
keywords: [fileshub quick start, upload file api, curl file upload, fetch file upload, x-api-key, file storage tutorial]
last_update:
  date: 2026-06-23
  author: Ahsan Mahmood
---

# Quick Start

This walks you from nothing to a stored, downloadable file in about five minutes. You need a FilesHub project, an API key, and any HTTP client (`curl`, `fetch`, `axios`, or a language binding).

## 1. Get an API key

API keys are created in the Nova admin panel of your FilesHub deployment:

1. Sign in to the admin panel at `/nova` on your FilesHub host (for the hosted instance, ask the maintainer for access).
2. Open **Projects** and select (or create) your project.
3. Open **API Keys → Create API Key**, give it `write` (and `read`) permission, and create it.
4. Copy the key — it is shown once. It looks like `fh_live_xxxxxxxxxxxxxxxx`.

Keep the key out of client-side code in production (see [Authentication](authentication)).

## 2. Set your base URL

Every endpoint lives under the versioned base URL:

```
https://fileshub.zaions.com/api/v1
```

If you run your own FilesHub, swap in your host. The rest of these docs use the hosted base URL.

## 3. Upload a file

Send a `multipart/form-data` request with a `file` field and your key in `X-API-Key`. Add `visibility=public` so the file is openable by its URL.

```bash title="curl"
curl -X POST https://fileshub.zaions.com/api/v1/objects \
  -H "X-API-Key: fh_live_xxx" \
  -F "file=@/path/to/photo.jpg" \
  -F "visibility=public"
```

```js title="fetch (browser or Node 18+)"
const form = new FormData();
form.append('file', fileInput.files[0]); // a File/Blob
form.append('visibility', 'public');

const res = await fetch('https://fileshub.zaions.com/api/v1/objects', {
  method: 'POST',
  headers: { 'X-API-Key': 'fh_live_xxx' }, // do NOT set Content-Type; the browser sets the boundary
  body: form,
});
const object = await res.json();
console.log(object.url); // <- store this
```

A successful upload returns `201`:

```json
{
  "public_id": "01JDKQXXXXXXXXXXXXXXXXXXXXX",
  "project_id": "01JDKPXXXXXXXXXXXXXXXXXXXXX",
  "visibility": "public",
  "mime_type": "image/jpeg",
  "size_bytes": 524288,
  "url": "https://fileshub.zaions.com/api/v1/objects/01JDKQXXXXXXXXXXXXXXXXXXXXX",
  "expires_at": null
}
```

Store `url` (and optionally `public_id`) on your own record. That URL is the file.

## 4. Use the file

Because it is `public`, the URL works directly:

```html
<img src="https://fileshub.zaions.com/api/v1/objects/01JDKQXXXXXXXXXXXXXXXXXXXXX" alt="uploaded" />
```

## 5. Delete it when you're done

```bash title="curl"
curl -X DELETE https://fileshub.zaions.com/api/v1/objects/01JDKQXXXXXXXXXXXXXXXXXXXXX \
  -H "X-API-Key: fh_live_xxx"
```

Deleting removes both the database record and the stored bytes.

## What you just learned

You authenticated with `X-API-Key`, uploaded a multipart file to `POST /api/v1/objects`, read the `url` from the `201` response, rendered the file, and deleted it. That is the whole storage loop. Next, read [Authentication](authentication) to lock keys down for production, [File visibility](file-visibility) to choose `public` vs `private`, and the [API Reference](../api/overview) for every parameter and response field.
