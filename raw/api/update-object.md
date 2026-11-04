---
sidebar_position: 5
title: Change an object's expiry or visibility
description: PATCH /api/v1/objects/{public_id} changes when a FilesHub object expires, or whether it is public or private, after upload. Requires a write-permission API key of the object's project.
keywords: [fileshub expiry, PATCH object, extend file expiry, expires_at, expires_in_days, object visibility, make file private]
last_update:
  date: 2026-10-30
  author: Ahsan Mahmood
---

# Change an object's expiry or visibility

Changes when an object expires, after it was uploaded. Use it when the content's lifetime grows, for example when
a chat a person keeps holds the file, or to make a file uploaded as public private. The expiry is available since
backend `2026.10.25.3`, the visibility since `2026.10.30.2`.

```
PATCH /api/v1/objects/{public_id}
```

**Permission:** `write`, with a key of the object's own project. Another project's object answers `404`.

## Request

Send at least one field, and at most one of the two expiry fields:

| Field | Type | Notes |
|---|---|---|
| `expires_at` | ISO 8601 date or `null` | A date in the future, or `null` to keep the object until it is deleted. |
| `expires_in_days` | integer, 1–3650 | Counted from now. |
| `visibility` | `public` or `private` | A private object answers `401` to a read without a `read` key of its project, from the moment it changes. |

```bash title="curl"
curl -X PATCH https://fileshub.zaions.com/api/v1/objects/01JDKQXXXXXXXXXXXXXXXXXXXXX \
  -H "X-API-Key: fh_live_xxx" -H "Content-Type: application/json" \
  -d '{"expires_at": "2027-01-01T00:00:00Z"}'
```

## Response

### `200 OK`

```json
{
  "data": {
    "public_id": "01JDKQXXXXXXXXXXXXXXXXXXXXX",
    "project_id": "01JDKPXXXXXXXXXXXXXXXXXXXXX",
    "original_filename": "photo.jpg",
    "visibility": "private",
    "mime_type": "image/jpeg",
    "size_bytes": 48213,
    "url": "https://fileshub.zaions.com/api/v1/objects/01JDKQXXXXXXXXXXXXXXXXXXXXX",
    "expires_at": "2027-01-01T00:00:00+00:00"
  },
  "message": "Updated"
}
```

### Errors

| Status | When |
|---|---|
| `401` | Missing or invalid key. |
| `403` | The key has no `write` permission. |
| `404` | No object with that id in the key's project, or it has already expired. |
| `422` | No field sent, both expiry fields sent, a date in the past, `expires_in_days` out of range, or a `visibility` other than `public` or `private`. |

Each change is recorded in the project's audit log (`object.expiry_changed`, with the old and new dates).
