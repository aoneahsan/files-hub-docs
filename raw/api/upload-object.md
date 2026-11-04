---
sidebar_position: 2
title: Upload an object
description: POST /api/v1/objects uploads a multipart file to FilesHub and returns a 201 with the object's ULID, public URL, and metadata. Supports visibility and optional auto-expiry.
keywords: [fileshub upload, POST /api/v1/objects, multipart file upload api, file upload curl, file upload fetch, expires_in_days, visibility]
last_update:
  date: 2026-06-23
  author: Ahsan Mahmood
---

# Upload an object

Uploads a file and returns its stored representation, including the URL you serve it from.

```
POST /api/v1/objects
```

**Permission:** `write` · **Content-Type:** `multipart/form-data`

## Request

### Headers

| Header | Required | Notes |
|---|---|---|
| `X-API-Key` | Yes | A key with `write` permission. |
| `X-App-Id` | If the key is restricted to a native app | Your Android package / iOS bundle id (e.g. `com.example.myapp`). On a key restricted by **web origin**, this header is optional audit metadata — sending it never causes a rejection when your `Origin` is allowed. |

Do **not** set `Content-Type` manually in browsers/`fetch` — let the client set the multipart boundary.

### Form fields

| Field | Required | Type | Description |
|---|---|---|---|
| `file` | Yes | file | The file to store. Validated against the max upload size (default 10 MB; configurable per deployment) and any configured allowed-MIME list. |
| `visibility` | No | `public` \| `private` | Access control. Omitted → `private`. Integrations send `public`. |
| `expires_in_days` | No | integer (1–3650) | Auto-delete this many days from now. |
| `expires_at` | No | ISO-8601 datetime (future) | Auto-delete at this absolute time. Wins over `expires_in_days` if both are sent. |

## Examples

```bash title="curl"
curl -X POST https://fileshub.zaions.com/api/v1/objects \
  -H "X-API-Key: fh_live_xxx" \
  -F "file=@/path/to/report.pdf" \
  -F "visibility=public" \
  -F "expires_in_days=7"
```

```js title="fetch"
const form = new FormData();
form.append('file', file);          // a File/Blob
form.append('visibility', 'public');

const res = await fetch('https://fileshub.zaions.com/api/v1/objects', {
  method: 'POST',
  headers: { 'X-API-Key': 'fh_live_xxx' },
  body: form,
});
const object = await res.json();
```

```php title="PHP (Guzzle)"
$response = $client->post('https://fileshub.zaions.com/api/v1/objects', [
    'headers'   => ['X-API-Key' => 'fh_live_xxx'],
    'multipart' => [
        ['name' => 'file', 'contents' => fopen('/path/report.pdf', 'r')],
        ['name' => 'visibility', 'contents' => 'public'],
    ],
]);
$object = json_decode((string) $response->getBody(), true);
```

## Response

### `201 Created`

```json
{
  "public_id": "01JDKQXXXXXXXXXXXXXXXXXXXXX",
  "project_id": "01JDKPXXXXXXXXXXXXXXXXXXXXX",
  "visibility": "public",
  "mime_type": "application/pdf",
  "size_bytes": 1048576,
  "url": "https://fileshub.zaions.com/api/v1/objects/01JDKQXXXXXXXXXXXXXXXXXXXXX",
  "expires_at": "2026-06-30T12:00:00+00:00"
}
```

Persist `url` (and optionally `public_id`) on your own record. `expires_at` is `null` when no expiry was requested.

### Errors

| Status | When | Body |
|---|---|---|
| `401` | No / invalid `X-API-Key`. | `{ "message": "API key is required..." }` |
| `403` | Key lacks `write`, or origin/app not allowed. | `{ "message": "..." }` |
| `422` | Validation failed (no file, file too large, bad `visibility`, disallowed MIME). | `{ "message": "<first validation error>" }` |
| `429` | Rate limit exceeded. | `{ "message": "..." }` |
| `500` | Server error while storing. | `{ "message": "An error occurred while uploading the file." }` |

## Notes

- The `public_id` is a [ULID](https://github.com/ulid/spec): time-sortable and URL-safe.
- The stored file keeps its original filename for downloads (`Content-Disposition`).
- Set `visibility` deliberately — see [File visibility](../getting-started/file-visibility).
- **`mime_type` is detected from the file's *contents*, not from any `Content-Type` you set on the
  multipart part.** FilesHub sniffs the bytes (so a mislabelled file can't be served as, say,
  `text/html`) and serves the object with that detected type. A `Content-Type` you declare on the part
  is **ignored** — don't rely on it round-tripping, and read `mime_type` back off the response as
  authoritative. There is no field to override it, so treat the server's detection as final.
