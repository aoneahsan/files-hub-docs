---
sidebar_position: 3
title: Get / download an object
description: GET /api/v1/objects/{public_id} streams a stored file back from FilesHub. Public objects need no key; private objects require a read-permission key from the same project.
keywords: [fileshub download, GET object, stream file api, download file curl, public file url, private file download]
last_update:
  date: 2026-06-23
  author: Ahsan Mahmood
---

# Get / download an object

Streams a stored file back with its real content type and original filename.

```
GET /api/v1/objects/{public_id}
```

**Permission:** none for `public` objects · `read` for `private` objects

## Request

### Path parameters

| Parameter | Description |
|---|---|
| `public_id` | The ULID of the stored object (from the upload response). |

### Headers

| Header | Required | Notes |
|---|---|---|
| `X-API-Key` | Only for `private` objects | A key with `read` permission from the same project. |

## Examples

```bash title="Public object — no key"
curl -L https://fileshub.zaions.com/api/v1/objects/01JDKQXXXXXXXXXXXXXXXXXXXXX \
  --output download.pdf
```

```bash title="Private object — read key"
curl -L https://fileshub.zaions.com/api/v1/objects/01JDKQXXXXXXXXXXXXXXXXXXXXX \
  -H "X-API-Key: fh_live_xxx" \
  --output download.pdf
```

```html title="Render a public object directly"
<img src="https://fileshub.zaions.com/api/v1/objects/01JDKQXXXXXXXXXXXXXXXXXXXXX" alt="" />
```

```js title="Download a private object server-side"
const res = await fetch(`https://fileshub.zaions.com/api/v1/objects/${publicId}`, {
  headers: { 'X-API-Key': process.env.FILESHUB_READ_KEY },
});
const blob = await res.blob(); // then stream to your authorised user
```

## Response

### `200 OK`

The raw file is streamed with appropriate headers:

```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="report.pdf"

<binary file data>
```

### Errors

| Status | When | Body |
|---|---|---|
| `401` | The object is `private` and no key was supplied. | `{ "message": "This object is private. Provide a valid API key with read permission." }` |
| `403` | The key lacks `read` permission. | `{ "message": "API key does not have read permission" }` |
| `404` | Object not found, expired, from another project, or the stored file is missing. | `{ "message": "Not found" }` |

## Expiry behaviour

If the object had an `expires_at` and that time has passed, the first `GET` treats it as gone: FilesHub deletes it (removing the stored file) and returns `404`. Expired files clean themselves up on access; you never serve stale bytes.
