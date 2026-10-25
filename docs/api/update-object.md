---
sidebar_position: 5
title: Change an object's expiry
description: PATCH /api/v1/objects/{public_id} changes when a FilesHub object expires after upload. Extend it, set it in days, or clear it. Requires a write-permission API key of the object's project.
keywords: [fileshub expiry, PATCH object, extend file expiry, expires_at, expires_in_days]
last_update:
  date: 2026-10-25
  author: Ahsan Mahmood
---

# Change an object's expiry

Changes when an object expires, after it was uploaded. Use it when the content's lifetime grows, for example when
a chat a person keeps holds the file. Available since backend `2026.10.25.3`.

```
PATCH /api/v1/objects/{public_id}
```

**Permission:** `write`, with a key of the object's own project. Another project's object answers `404`.

## Request

Send exactly one of:

| Field | Type | Notes |
|---|---|---|
| `expires_at` | ISO 8601 date or `null` | A date in the future, or `null` to keep the object until it is deleted. |
| `expires_in_days` | integer, 1–3650 | Counted from now. |

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
| `422` | Neither field sent, both sent, a date in the past, or `expires_in_days` out of range. |

Each change is recorded in the project's audit log (`object.expiry_changed`, with the old and new dates).
