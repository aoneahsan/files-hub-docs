---
sidebar_position: 4
title: List objects
description: GET /api/v1/objects returns a paginated list of your project's stored files, newest first, with an optional visibility filter. Requires a read-permission API key.
keywords: [fileshub list objects, list files api, paginate files, GET /api/v1/objects, per_page, visibility filter]
last_update:
  date: 2026-06-23
  author: Ahsan Mahmood
---

# List objects

Returns a paginated list of the authenticated project's objects, newest first.

```
GET /api/v1/objects
```

**Permission:** `read`

## Request

### Headers

| Header | Required | Notes |
|---|---|---|
| `X-API-Key` | Yes | A key with `read` permission. |

### Query parameters

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `page` | integer (≥1) | `1` | Page number. |
| `per_page` | integer (1–100) | `20` | Items per page; capped at 100. |
| `visibility` | `public` \| `private` | — | Optional filter. |

## Example

```bash title="curl"
curl "https://fileshub.zaions.com/api/v1/objects?page=1&per_page=20&visibility=public" \
  -H "X-API-Key: fh_live_xxx"
```

```js title="fetch"
const params = new URLSearchParams({ page: '1', per_page: '50' });
const res = await fetch(`https://fileshub.zaions.com/api/v1/objects?${params}`, {
  headers: { 'X-API-Key': 'fh_live_xxx', Accept: 'application/json' },
});
const { data, meta } = await res.json();
```

## Response

### `200 OK`

```json
{
  "data": [
    {
      "public_id": "01JDKQXXXXXXXXXXXXXXXXXXXXX",
      "original_filename": "photo.jpg",
      "mime_type": "image/jpeg",
      "size_bytes": 524288,
      "visibility": "public",
      "url": "https://fileshub.zaions.com/api/v1/objects/01JDKQXXXXXXXXXXXXXXXXXXXXX",
      "created_at": "2026-06-23T12:00:00+00:00"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 150
  }
}
```

### Errors

| Status | When | Body |
|---|---|---|
| `401` | No / invalid `X-API-Key`. | `{ "message": "..." }` |
| `403` | Key lacks `read` permission. | `{ "message": "..." }` |
| `422` | Invalid query parameter (e.g. `per_page` > 100). | `{ "message": "<first validation error>" }` |

## Paging through everything

Request pages until you have collected `meta.total` items:

```js
async function listAll(key) {
  const out = [];
  let page = 1;
  for (;;) {
    const res = await fetch(
      `https://fileshub.zaions.com/api/v1/objects?page=${page}&per_page=100`,
      { headers: { 'X-API-Key': key } },
    );
    const { data, meta } = await res.json();
    out.push(...data);
    if (out.length >= meta.total || data.length === 0) break;
    page++;
  }
  return out;
}
```
