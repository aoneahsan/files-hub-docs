---
title: The person API (/api/account/v1)
sidebar_label: The API
description: Every call of the FilesHub person API with curl examples — your account, projects, file metadata, 5-minute download links, deletes that wait for your yes, usage and limits, the email log without bodies, and your webhooks. One envelope, cursor pages, an OpenAPI 3.1 file.
keywords: [fileshub person api, api/account/v1, fh_usr_ api, file download link api, email log api, openapi 3.1, cursor pagination]
tags: [other-apps]
last_update:
  date: 2026-11-22
  author: Ahsan Mahmood
---

# The person API

**The person API answers your scripts about your own projects: who you are, which projects you belong to,
the files in them, 5-minute download links, this month's usage and the email log. It lives at
`https://fileshub.zaions.com/api/account/v1` and takes one credential: an
[access key](./access-keys.md), sent as `Authorization: Bearer fh_usr_…`.**

- **Base URL:** `https://fileshub.zaions.com/api/account/v1`
- **Auth:** `Authorization: Bearer fh_usr_…` — nothing else. `fh_pat_` and `fh_live_` values get `401`.
- **Machine truth:** [`/api/account/v1/openapi.json`](https://fileshub.zaions.com/api/account/v1/openapi.json)
  (OpenAPI 3.1, no key needed). Each operation names the scope it needs in `x-scope`.
- **Answers:** `{ "data": … }`; a list adds `meta`; an error is `{ "error": { "code", "message" } }`.

:::info
The API answers once an admin has switched on the API door. While it is off, every path here, the OpenAPI
file included, answers `404`.
:::

The examples read the key from an environment variable:

```bash
export FILESHUB_KEY="fh_usr_…"   # from Account → Other apps → Access keys
```

## Every call

| Call | Scope | What it answers |
|---|---|---|
| `GET /token` | none | What this key is: name, prefix, scopes, projects, end |
| `GET /me` | `account:read` | Your name, email and the plans on your projects |
| `GET /projects` | `projects:read` | The projects you belong to |
| `GET /projects/{project}/files` | `files:read` | Files in one project, newest first |
| `GET /files/{file}` | `files:read` | One file's details (never its content) |
| `POST /files/{file}/download-link` | `files:read` | A link that downloads one file for 5 minutes |
| `DELETE /files/{file}` | `files:delete` | Ask to delete a file; you say yes on FilesHub within 10 minutes |
| `GET /removals/{removal}` | `files:delete` | Whether a delete this key asked for was confirmed, kept or ended |
| `GET /usage` | `usage:read` | This month's use per project and service, and your other-app limits |
| `GET /email-log` | `email_log:read` | Who was sent what and whether it went. Never the message |
| `GET /webhooks` | `webhooks:read` | Your webhook endpoints (never a signing secret) |
| `GET /webhooks/{webhook}/deliveries` | `webhooks:read` | One endpoint's deliveries, newest first |

`GET /token` is shown on [Access keys](./access-keys.md#check-a-key-from-a-script). Project and file ids
are the 26-character ids FilesHub shows everywhere else.

## Your account

```bash
curl -s https://fileshub.zaions.com/api/account/v1/me -H "Authorization: Bearer $FILESHUB_KEY"
```

```json
{
  "data": {
    "name": "Sana Iqbal",
    "email": "sana@harbourlabs.example",
    "plans": ["Email sending API", "File storage API"]
  }
}
```

## Projects you belong to

```bash
curl -s https://fileshub.zaions.com/api/account/v1/projects -H "Authorization: Bearer $FILESHUB_KEY"
```

```json
{
  "data": [
    {
      "id": "01JZ8D2K4M6P8R0T2V4X6Y8A0C",
      "name": "Harbour Receipts",
      "role": "operator",
      "services": ["email", "files"],
      "created_at": "2026-03-04T10:22:41+00:00"
    }
  ]
}
```

Only the projects this key was given **and** you still belong to are listed. `role` is `viewer` or
`operator`.

## Files

```bash
curl -s "https://fileshub.zaions.com/api/account/v1/projects/01JZ8D2K4M6P8R0T2V4X6Y8A0C/files?per_page=2" \
  -H "Authorization: Bearer $FILESHUB_KEY"
```

```json
{
  "data": [
    {
      "id": "01KAP3W9Q7J2M8R4T6V0X1Y3Z5",
      "project_id": "01JZ8D2K4M6P8R0T2V4X6Y8A0C",
      "name": "receipt-2026-10-31-0042.pdf",
      "size_bytes": 184320,
      "type": "application/pdf",
      "visibility": "private",
      "uploaded_at": "2026-10-31T16:05:12+00:00"
    },
    {
      "id": "01KAP3T1D5F7H9K1M3N5P7Q9R1",
      "project_id": "01JZ8D2K4M6P8R0T2V4X6Y8A0C",
      "name": "receipt-2026-10-31-0041.pdf",
      "size_bytes": 176128,
      "type": "application/pdf",
      "visibility": "private",
      "uploaded_at": "2026-10-31T15:58:40+00:00"
    }
  ],
  "meta": { "next_cursor": "YzQ4MTI", "has_more": true, "per_page": 2 }
}
```

`GET /files/{file}` answers one file in the same shape. A file's content never comes through the API;
make a download link for that.

### Pages

Lists are newest first, 25 to a page by default and at most 50 (`per_page`). When `meta.has_more` is
`true`, pass `meta.next_cursor` back as `cursor` for the next page:

```bash
curl -s "https://fileshub.zaions.com/api/account/v1/projects/01JZ8D2K4M6P8R0T2V4X6Y8A0C/files?cursor=YzQ4MTI" \
  -H "Authorization: Bearer $FILESHUB_KEY"
```

A `per_page` above 50 is refused with `422 validation_failed`, not quietly shortened.

## A download link

```bash
curl -s -X POST https://fileshub.zaions.com/api/account/v1/files/01KAP3W9Q7J2M8R4T6V0X1Y3Z5/download-link \
  -H "Authorization: Bearer $FILESHUB_KEY"
```

```json
{
  "data": {
    "url": "https://fileshub.zaions.com/api/account/v1/files/01KAP3W9Q7J2M8R4T6V0X1Y3Z5/download?by=key.18&expires=1795339142&signature=9b1e4c0a7d2f5e8b3c6a9d0f1e2b4c7a8d5e3f6b9c0a1d2e4f7b8c9a0d3e5f6b",
    "expires_at": "2026-11-22T09:19:02+00:00"
  }
}
```

The answer is `201`. The link needs no header and works for 5 minutes. At download time FilesHub checks
again that the key behind it is still live and still reaches the file's project, so revoking the key
stops its links too.

## Deletes wait for you

A key never deletes a file by itself. `DELETE /files/{file}` **asks**: FilesHub emails you, and the file
goes only when you say yes on FilesHub, with a fresh sign-in or your two-step code, within 10 minutes.

```bash
curl -s -X DELETE https://fileshub.zaions.com/api/account/v1/files/01KAP3W9Q7J2M8R4T6V0X1Y3Z5 \
  -H "Authorization: Bearer $FILESHUB_KEY"
```

```json
{
  "data": {
    "id": "del_q4w8n2kd7xzt",
    "file_id": "01KAP3W9Q7J2M8R4T6V0X1Y3Z5",
    "status": "waiting",
    "expires_at": "2026-11-22T09:24:02+00:00",
    "confirm_url": "https://fileshub.zaions.com/account/apps/confirm/del_q4w8n2kd7xzt"
  }
}
```

The answer is `202`. Asking twice for the same file while a request is waiting answers the same request.
Ask how it ended with the request id:

```bash
curl -s https://fileshub.zaions.com/api/account/v1/removals/del_q4w8n2kd7xzt \
  -H "Authorization: Bearer $FILESHUB_KEY"
```

| `status` | Means |
|---|---|
| `waiting` | Nobody has answered yet |
| `deleted` | You said yes; the file is gone |
| `kept` | You said no |
| `expired` | Ten minutes passed without an answer; nothing was deleted |
| `changed` | The file was replaced or renamed after the request, so FilesHub would not delete it |
| `cancelled` | The key was revoked before anyone answered |

A key can read only the requests it made itself. The request is refused in a project where you are a
viewer, and on the confirm page FilesHub checks again that you are still an operator there.

## Usage and limits

```bash
curl -s https://fileshub.zaions.com/api/account/v1/usage -H "Authorization: Bearer $FILESHUB_KEY"
```

```json
{
  "data": {
    "projects": [
      {
        "project_id": "01JZ8D2K4M6P8R0T2V4X6Y8A0C",
        "name": "Harbour Receipts",
        "files": 412,
        "storage_bytes": 73400320,
        "emails_this_month": 1288,
        "services": [
          { "service": "files", "name": "File storage API", "requests_today": 3120, "requests_per_day": 5000 },
          { "service": "email", "name": "Email sending API", "requests_today": 96, "requests_per_day": 2000 }
        ]
      }
    ],
    "other_apps": {
      "limits": { "access_keys": 5, "requests_per_day": 5000, "webhook_endpoints": 3, "assistants": 2 },
      "used": { "access_keys": 2, "requests_per_day": 41, "webhook_endpoints": 1, "assistants": 1 }
    }
  }
}
```

`files` and `storage_bytes` are totals; `emails_this_month` counts from the first of the month.
`other_apps.limits` are your [limits](./index.md#limits); `null` means no limit. The numbers above are an
example — your plan sets yours.

## The email log

```bash
curl -s "https://fileshub.zaions.com/api/account/v1/email-log?project=01JZ8D2K4M6P8R0T2V4X6Y8A0C&per_page=1" \
  -H "Authorization: Bearer $FILESHUB_KEY"
```

```json
{
  "data": [
    {
      "id": "01KAQ0B8C2D4E6F8G0H2J4K6M8",
      "project_id": "01JZ8D2K4M6P8R0T2V4X6Y8A0C",
      "to": "accounts@northwindfreight.example",
      "subject": "Your October receipts",
      "status": "sent",
      "sent_at": "2026-11-01T06:00:14+00:00",
      "created_at": "2026-11-01T06:00:02+00:00"
    }
  ],
  "meta": { "next_cursor": "YzkwMjE", "has_more": true, "per_page": 1 }
}
```

Leave out `project` to read every project the key reaches. The log never carries a message body or an
attachment.

## Your webhooks

`GET /webhooks` pages through your endpoints, newest first, never a signing secret. It takes `per_page` and
`cursor` like every other list:

```json
{
  "data": [
    {
      "id": "ep_m7x2c9rk4tqa",
      "url": "https://hooks.harbourlabs.example/fileshub",
      "description": "Receipts sync",
      "events": ["file.uploaded", "file.deleted"],
      "status": "active",
      "created_at": "2026-11-10T08:30:00+00:00"
    }
  ],
  "meta": { "next_cursor": null, "has_more": false, "per_page": 25 }
}
```

`GET /webhooks/{webhook}/deliveries` pages through the last 30 days of one endpoint's deliveries, each with
`id`, `message_id` (the `webhook-id` your server saw), `event`, `status` (`pending`, `delivered`, `failed`
or `held`), `attempt`, `response_status` and `sent_at`. Endpoints are added and changed only on FilesHub —
see [Webhooks](./webhooks.md).

## Errors

| Status | `code` | When |
|---|---|---|
| `401` | `wrong_credential` | An `fh_pat_` or `fh_live_` value was sent. This API takes an `fh_usr_` access key |
| `401` | `invalid_key` | The key is not recognised, was revoked, or has ended |
| `403` | `missing_scope` | The key was not given the scope; `details.scope` names it |
| `404` | `not_found` | It does not exist, or it is outside this key's projects |
| `422` | `validation_failed` | A query value is wrong; `details` names the field |
| `429` | `rate_limited` | Today's requests on your plan are used up |

```json
{
  "error": {
    "code": "missing_scope",
    "message": "This key or assistant was not given usage:read.",
    "details": { "scope": "usage:read" }
  }
}
```

A `429` from the daily limit carries `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` and
`Retry-After`; the count starts again at midnight GMT+5. Bursts above 120 requests a minute also get `429`.
Every answer to a keyed call is sent with `Cache-Control: no-store`.
