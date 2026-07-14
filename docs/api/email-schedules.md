---
sidebar_position: 9
title: Recurring email schedules
description: Define cron-based recurring emails in FilesHub — create, list, update, pause, delete, and run-now — each sending to up to 50 recipients per run from a template or raw content.
keywords: [fileshub email schedule, recurring email, cron email api, scheduled email, POST /api/v1/email-schedules, run now]
last_update:
  date: 2026-07-14
  author: Ahsan Mahmood
---

# Recurring email schedules

**A schedule sends the same email on a cron cadence** — a daily digest, a weekly report — to a fixed recipient list. FilesHub evaluates every active schedule each minute and sends one email per recipient when it is due.

## Create a schedule

```
POST /api/v1/email-schedules
```

**Permission:** `write` · **Content-Type:** `application/json`

| Field | Required | Type | Description |
|---|---|---|---|
| `name` | Yes | string (≤255) | Label for the schedule. |
| `recipients` | Yes | array (1–50) | Each `{ email, name? }`. One email per recipient per run. |
| `cron_expression` | Yes | string | Standard 5-field cron (`0 9 * * 1` = Mondays 09:00) or a preset: `@hourly`, `@daily`, `@weekly`, `@monthly`. |
| `timezone` | No | string | IANA timezone the cron is evaluated in (e.g. `Asia/Karachi`). |
| `template` | One of template/raw | string | A template `slug` (wins over raw content). |
| `variables` | No | object | Values for the template placeholders. |
| `subject` | One of template/raw | string (≤500) | Raw subject (required without a template). |
| `body_html` | One of template/raw | string | Raw HTML body. |
| `body_text` | One of template/raw | string | Raw text body. |
| `cc` / `bcc` | No | array (≤10) | Extra recipients per run. |
| `reply_to` | No | email | Reply-to. |
| `from_name` | No | string | From display name. |
| `domain` | No | string | Verified sending domain (see [Send an email](emails-send)). |
| `description` | No | string (≤2000) | Internal note. |
| `is_active` | No | boolean | Defaults to active. |

```bash
curl -X POST https://fileshub.zaions.com/api/v1/email-schedules \
  -H "X-API-Key: fh_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weekly digest",
    "recipients": [{ "email": "team@example.com", "name": "Team" }],
    "cron_expression": "@weekly",
    "timezone": "Asia/Karachi",
    "template": "weekly-digest",
    "variables": { "week": "28" }
  }'
```

## Manage schedules

| Method | Path | Permission | Purpose |
|---|---|---|---|
| `GET` | `/email-schedules` | `read` | List schedules (paginated). |
| `GET` | `/email-schedules/{id}` | `read` | Show one schedule. |
| `PATCH` | `/email-schedules/{id}` | `write` | Update any field. `{"is_active": false}` **pauses**; `true` resumes. |
| `DELETE` | `/email-schedules/{id}` | `write` | Delete the schedule. |
| `POST` | `/email-schedules/{id}/run` | `write` | **Run now** — send this run immediately, off-cadence. |

`{id}` is the schedule's ULID `public_id`.

```bash title="Pause a schedule"
curl -X PATCH https://fileshub.zaions.com/api/v1/email-schedules/01JSCHEDXXXXXXXXXXXXXXXXXX \
  -H "X-API-Key: fh_live_xxx" -H "Content-Type: application/json" \
  -d '{ "is_active": false }'
```

## Notes

- **Runs need the server scheduler.** FilesHub's minute cron drives due schedules; a self-hosted deployment must have Laravel's scheduler wired.
- **≤50 recipients per run.** Each gets a separate email. For larger lists, split into multiple schedules or use your own batching over [Send an email](emails-send).
- **Template or raw, not both.** If `template` is set it wins; otherwise `subject` + a body are required.
- **Every run is queued** and shows up in [Job status](jobs) and the email log.
