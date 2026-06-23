---
sidebar_position: 5
title: Delete an object
description: DELETE /api/v1/objects/{public_id} permanently removes a FilesHub object — both the database record and the stored file. Requires a write-permission API key.
keywords: [fileshub delete, DELETE object, remove file api, delete file curl, write permission]
last_update:
  date: 2026-06-23
  author: Ahsan Mahmood
---

# Delete an object

Permanently deletes an object. The database record and the stored file are removed together (a model event cleans up the bytes), so there are no orphaned files.

```
DELETE /api/v1/objects/{public_id}
```

**Permission:** `write`

## Request

### Path parameters

| Parameter | Description |
|---|---|
| `public_id` | The ULID of the object to delete. Must belong to the key's project. |

### Headers

| Header | Required | Notes |
|---|---|---|
| `X-API-Key` | Yes | A key with `write` permission. |

## Example

```bash title="curl"
curl -X DELETE https://fileshub.zaions.com/api/v1/objects/01JDKQXXXXXXXXXXXXXXXXXXXXX \
  -H "X-API-Key: fh_live_xxx"
```

```js title="fetch"
const res = await fetch(`https://fileshub.zaions.com/api/v1/objects/${publicId}`, {
  method: 'DELETE',
  headers: { 'X-API-Key': 'fh_live_xxx' },
});
if (res.ok) {
  // object gone — drop the url from your record
}
```

## Response

### `200 OK`

```json
{ "message": "Deleted" }
```

### Errors

| Status | When | Body |
|---|---|---|
| `401` | No / invalid `X-API-Key`. | `{ "message": "..." }` |
| `403` | Key lacks `write` permission. | `{ "message": "..." }` |
| `404` | Object not found, or it belongs to a different project. | `{ "message": "Not found" }` |
| `500` | Server error during deletion. | `{ "message": "An error occurred while deleting the object." }` |

## Notes

- Deletion is permanent — there is no trash or undo. Confirm in your own UI before calling.
- A key can only delete objects in its own project; cross-project deletes return `404` so existence isn't leaked.
- When you delete a record from your app, also delete the FilesHub object so storage doesn't accumulate orphans. (This is exactly what the file-cleanup convention in the wider FilesHub integration guide recommends.)
