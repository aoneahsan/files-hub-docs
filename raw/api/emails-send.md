---
sidebar_position: 7
title: Send an email
description: POST /api/v1/emails/send sends transactional email through FilesHub — raw HTML/text or a saved template, from one of three verified domains, queued by default with a job to poll.
keywords: [fileshub email api, send email api, transactional email, POST /api/v1/emails/send, queued email, email domain, X-API-Key email scope]
last_update:
  date: 2026-07-14
  author: Ahsan Mahmood
---

# Send an email

**`POST /api/v1/emails/send` sends one transactional email — either raw HTML/text or a saved template — from a verified FilesHub domain.** It is queued by default: the call returns immediately with a job id you can poll, and delivery follows within about a minute with automatic retries.

```
POST /api/v1/emails/send
```

**Permission:** `email` · **Content-Type:** `application/json`

## Request

### Headers

| Header | Required | Notes |
|---|---|---|
| `X-API-Key` | Yes | A key with the `email` permission (`can_send_emails`). |
| `Content-Type` | Yes | `application/json`. |
| `X-App-Id` | If the key is app-restricted | Your app package / bundle id. See [API key restrictions](../getting-started/api-key-restrictions). |

### Body — raw content

Send one recipient per call (loop for more). Provide at least one of `body_html` / `body_text`.

| Field | Required | Type | Description |
|---|---|---|---|
| `to` | Yes | email | The recipient address. |
| `to_name` | No | string (≤255) | Recipient display name. |
| `subject` | Yes | string (≤500) | Subject line. |
| `body_html` | One of html/text | string | HTML body (max ~500 KB, configurable per deployment). |
| `body_text` | One of html/text | string | Plain-text body (max ~500 KB). |
| `from_name` | No | string (≤255) | Display name on the `From` line. The address is the sending domain's mailbox. |
| `cc` | No | array (≤10) of emails | Carbon-copy recipients. |
| `bcc` | No | array (≤10) of emails | Blind-copy recipients. |
| `reply_to` | No | email | Reply-to address. |
| `attachments` | No | array (≤5) of ULIDs | Pre-uploaded FilesHub object ids (upload with [POST /objects](upload-object) first). Each entry is a 26-char ULID. |
| `domain` | No | string | Which verified sending domain to use — `aoneahsan.com` (default), `zaions.com`, or `trizlink.com`. Omitted → the admin-set default with automatic fallback. |
| `queue` | No | boolean | `true` (default) queues the send; `false` sends synchronously (use for OTP / latency-sensitive mail). |
| `scheduled_at` | No | ISO-8601 (future) | Send once at a future time instead of now. |

### Body — template

To send a saved [template](email-templates), send `template` instead of `subject`/`body_*`:

| Field | Required | Type | Description |
|---|---|---|---|
| `template` | Yes | string | The template `slug`. |
| `variables` | No | object | Values substituted into the template's placeholders. |

`to`, `cc`, `bcc`, `reply_to`, `from_name`, `domain`, `queue`, `attachments`, and `scheduled_at` apply to template sends too.

## Examples

```bash title="curl — raw HTML, queued"
curl -X POST https://fileshub.zaions.com/api/v1/emails/send \
  -H "X-API-Key: fh_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "to_name": "Sam",
    "subject": "Welcome",
    "body_html": "<h1>Welcome!</h1><p>Thanks for signing up.</p>",
    "from_name": "Acme",
    "domain": "zaions.com"
  }'
```

```bash title="curl — synchronous OTP"
curl -X POST https://fileshub.zaions.com/api/v1/emails/send \
  -H "X-API-Key: fh_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Your code",
    "body_text": "Your code is 123456",
    "queue": false
  }'
```

```js title="fetch — template"
const res = await fetch('https://fileshub.zaions.com/api/v1/emails/send', {
  method: 'POST',
  headers: { 'X-API-Key': 'fh_live_xxx', 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'user@example.com',
    template: 'welcome',
    variables: { name: 'Sam', plan: 'Pro' },
  }),
});
const { data } = await res.json();
```

## Response

### `202 Accepted` — queued (default)

```json
{
  "success": true,
  "data": {
    "id": "01JEMAILLOGXXXXXXXXXXXXXXX",
    "status": "queued",
    "from_email": "noreply@zaions.com",
    "domain": "zaions.com",
    "job_id": "01JJOBXXXXXXXXXXXXXXXXXXXX",
    "status_url": "https://fileshub.zaions.com/api/v1/jobs/01JJOBXXXXXXXXXXXXXXXXXXXX",
    "scheduled_at": null,
    "sent_at": null
  }
}
```

Poll `status_url` — see [Job status](jobs) — until the job is `completed` or `failed`.

### `201 Created` — synchronous (`queue: false`) or scheduled

Same shape; `status` is the delivered status (e.g. `sent`) and `sent_at` is set. For a `scheduled_at` send, `status_url` points at the email log and `scheduled_at` is echoed back.

### Errors

| Status | When |
|---|---|
| `401` | No / invalid `X-API-Key`. |
| `403` | Key lacks the `email` permission, or origin/app not allowed. |
| `422` | Validation failed — missing recipient/body, unknown/inactive `domain`, bad attachment id. |
| `429` | The sending account's daily quota is exhausted. Retry after the reset (or the key's `email_daily_limit`). |
| `503` | The requested domain is temporarily without sending capacity. Retry with backoff. |

## Notes

- **One recipient per call.** Use `cc`/`bcc` for extra visible/hidden copies; loop for separate sends.
- **Domains are verified mailboxes.** The `From` address is the domain's own mailbox (e.g. `noreply@zaions.com`); `from_name` still rides along.
- **Attachments are FilesHub objects.** Upload the file first, then pass its ULID — there is no direct MIME attachment.
- **Quotas are per sending account.** Queue and retry on `429`/`503`; queued sends already retry automatically (three attempts with backoff).
- **Audit.** Send an optional `X-App-Id` header and FilesHub records the caller's app id, ip, and user-agent on the email log for debugging.
