---
sidebar_position: 2
title: Email marketing API
description: Endpoints for FilesHub email marketing — lists, contacts, paste and CSV imports, suppressions, sequences, enrollment, test sends, product events and the public subscribe form — on the data plane and the management plane.
keywords: [email marketing api, POST /email-lists, contact import api, paste import, csv import api, sequences api, enroll contacts, email events api, subscribe endpoint, suppression api]
tags: [email-marketing]
last_update:
  date: 2026-10-03
  author: Ahsan Mahmood
---

# Email marketing API

**Base URL:** `https://fileshub.zaions.com/api/v1` with `X-API-Key: fh_live_…` (a key with
`can_manage_email_marketing`). Every path below also exists on the management plane as
`https://fileshub.zaions.com/api/public/v1/projects/{project}/…` with `Authorization: Bearer fh_pat_…`.
All ids are public ids (26-character ULIDs). Lists are [paginated](../api/pagination.md) — 20 by default,
50 at most.

**Envelopes.** Data plane: `{"success": true, "data": …}`; lists `{"success": true, "data": [], "meta": {}, "message": ""}`;
errors `{"success": false, "message": "…", "code": "list_archived", "errors": {…}}`. Management plane:
`{"data": …}` and `{"error": {"code", "message", "details"}}`.

🔴 **Server-side only.** Every endpoint except `subscribe` refuses a request carrying a browser `Origin`
header with `403 "This endpoint is server-side only."` — these endpoints return personal data.

## Lists

| Method | Path | Notes |
|---|---|---|
| `GET` | `/email-lists` | `?include_archived=1` |
| `POST` | `/email-lists` | `{name, description?, default_consent_basis?, double_opt_in?, token_hosts?, confirmation_template?}` → 201 |
| `GET` | `/email-lists/{list}` | Counters are maintained: `contacts_count`, `active_count` |
| `PATCH` | `/email-lists/{list}` | The same fields, plus `archived: true|false` |

`confirmation_template` is the slug of a **transactional** template containing `{{confirm_url}}`, required
before a double opt-in form can accept sign-ups.

## Contacts and imports

| Method | Path | Notes |
|---|---|---|
| `GET` | `/email-lists/{list}/contacts` | `?status=&tag=&q=` (prefix search on email and names) |
| `POST` | `/email-lists/{list}/contacts` | One contact through the pipeline: 201 created · 200 `{duplicate: true}` · 422 with a `code` (`invalid_syntax`, `no_mx`, `missing_consent`, `suppressed`) |
| `GET` · `PATCH` | `/email-contacts/{contact}` | Names, tags, custom fields, source, reason — never `status` |
| `POST` | `/email-contacts/{contact}/unsubscribe` | Suppress across the project |
| `POST` | `/email-lists/{list}/contacts/bulk-tag` | `{contact_ids? or filter?, add?, remove?}` |
| `POST` | `/email-lists/{list}/imports` | Paste or CSV — see below |
| `GET` | `/email-imports/{import}` | Status, counters, progress |
| `GET` | `/email-imports/{import}/rejected` | `text/csv`: `row_number, email, reason` |
| `POST` | `/email-imports/{import}/resume` | Continue a failed CSV import from where it stopped |

**Paste import** — finishes in the request (201):

```bash
curl -X POST https://fileshub.zaions.com/api/v1/email-lists/01J9XK…/imports \
  -H "X-API-Key: fh_live_xxx" -H "Content-Type: application/json" \
  -d '{"method":"paste","text":"Sara Khan <sara@example.org>, bilal@example.com\nnot-an-email",
       "defaults":{"consent_basis":"existing_relationship","source_platform":"manual","tags":["friends"]}}'
```

```json
{ "success": true, "data": { "id": "01J9Y…", "status": "completed", "method": "paste", "total_rows": 3,
  "accepted": 2, "duplicate": 0, "invalid_syntax": 1, "no_mx": 0, "suppressed": 0, "missing_consent": 0,
  "updated_existing": 0, "processed_rows": 3 } }
```

**CSV import** — upload the file first as a **private** object (`POST /objects`, `visibility: private` — it
holds personal data), then `{"method":"csv","object":"<public_id>","column_map":{"Email":"email",…},"keep_columns":[],"defaults":{…},"update_existing":false}`.
Up to 500 rows finish in the request (201); larger files run in the background, 500 rows a minute (202) —
poll the import. Without `column_map`, headers are mapped by name (`email`, `first name`, `linkedin profile url`, …).
The counters always add up to `total_rows`, and importing the same rows again accepts none of them.

## Suppressions

| Method | Path | Notes |
|---|---|---|
| `GET` | `/email-suppressions` | Hashes only; `?email=` looks one address up |
| `POST` | `/email-suppressions` | `{email}` → a `manual` suppression |

Removing a suppression is an admin action in the dashboard, with a written reason.

## Sequences

| Method | Path | Notes |
|---|---|---|
| `GET` · `POST` | `/email-sequences` | Create with `{name, list, max_recipients, exit_events?, enroll_tags?, auto_enroll_new_contacts?, track_opens?, steps: [...]}` |
| `GET` · `PATCH` | `/email-sequences/{sequence}` | Detail includes steps (with the condition in plain words) and measured stats. While a draft, `steps` replaces all; once running, only a step's `template`, `delay_hours` and `variables` change |
| `GET` | `/email-sequences/{sequence}/check` | The activation checks, without activating |
| `POST` | `…/activate` · `…/resume` · `…/pause` · `…/finish` | Activation returns 422 `activation_refused` listing **every** problem |
| `POST` | `/email-sequences/{sequence}/enroll` | `{all: true}` · `{tags: [...]}` · `{contact_ids: [...]}` (≤ 500) → `{enrolled, already, refused_suppressed, refused_status}` |
| `GET` | `/email-sequences/{sequence}/enrollments` | `?state=&track=` |
| `POST` | `/email-sequences/{sequence}/steps/{key}/test` | `{to}` — a `[TEST]` copy; no enrollment moves |

A step:

```json
{ "key": "A2", "track": "A", "position": 2, "template": "lifewell-mkt-a2", "delay_hours": 72,
  "condition": { "if": "not_clicked", "else": { "route_to": "B" } }, "is_final": false }
```

Conditions: `always` · `clicked` · `not_clicked` · `event` / `no_event` (with `"event": "signed_up"`) ·
`all` (with `"of": [...]`). `else`: `"skip"` (default), `"exit"`, or `{"route_to": "<track>"}`. Opens never
drive a condition.

**Activation needs:** marketing enabled with a from name and a postal address, at least one active marketing
mailbox with SPF, DKIM and DMARC in place, every template a marketing template of this project (with a text
part, and the FilesHub layout or its own `{{unsubscribe_url}}` and `{{postal_address}}`), every track ending
in one final step, every `route_to` naming a real track, and no more matching contacts than `max_recipients`.

## Marketing templates

`POST /emails/templates` with `"is_marketing": true` creates a template that belongs to your project (it needs
a key with `can_manage_email_marketing`). Add `"layout": "marketing"` to write only the content — FilesHub
wraps it in the branded layout with the footer, postal address and unsubscribe line. Merge fields:
`{{first_name}}` (falls back to the step variable `default_first_name`, then "there"), `{{last_name}}`,
`{{email}}`, `{{contact_token}}`, `{{unsubscribe_url}}`, `{{postal_address}}`, `{{from_name}}`,
`{{brand_name}}`, `{{custom.<key>}}` and any step variable. Values are HTML-escaped; a field with no value
fails that send instead of mailing `{{braces}}` to a person. Marketing templates cannot be used by
`POST /emails/send`.

## Events

`POST /email-contacts/events` — `{contact_token, event, occurred_at?, meta?}`, or `{email, list, event}`
when you have no token. `event` is a lowercase slug; `clicked`, `unsubscribed`, `bounced`, `complained` and
`confirmed` are reserved. 201 the first time, 200 `{duplicate: true}` after; an unknown or another project's
token is 404. `POST /email-contacts/events/batch` takes up to 100 `{events: [...]}` and answers per item.

## Daily reports

From `2026.10.03.3`. FilesHub builds one report per project per sending day, every hour, on the server. Nothing
has to be run to get it.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/email-marketing/reports` | `?from=&to=` (`YYYY-MM-DD`, the project's timezone) and `?status=`; newest first, paginated |
| `GET` | `/email-marketing/reports/{day}` | One day, plus `sends`: time, mailbox, step and the wait since the send before (first 200) |

A report: `day`, `status` (`in_progress` · `complete` · `flagged`), `cap_that_day`, `sent`, `failed`,
`first_sent_at`, `last_sent_at`, `gaps {min_seconds, median_seconds, max_seconds}`, `paced`, `per_mailbox`,
`per_step`, `unique_clicks`, `unsubscribes`, `bounces`, `complaints`, `flags`, `note`, `generated_at`.
Flags: `over_cap`, `burst`, `gap_under_minimum`, `mailbox_not_rested`, `project_paused`,
`nothing_sent_with_due_work`. A report never contains a recipient, a delivery rate or an open rate. Clicks for a
day keep updating for 7 days.

## Settings

`GET` · `PATCH /email-marketing/settings` — `enabled`, `from_name`, `reply_to`, `postal_address`, brand
(`brand_name`, `brand_color`, `brand_logo_url`, `brand_website_url`), `daily_cap`, `send_window_start/end`,
`timezone`, `bounce_pause_threshold_percent`, and the pacing fields `send_gap_min_seconds` (default 300),
`send_gap_max_seconds` (default 900, never below the minimum) and `spread_sends` (default true). The response
carries a `pacing` block: `{min_gap_seconds, max_gap_seconds, spread, next_send_at, max_per_day}`. Since `2026.10.03.2` a project also warms up: `warmup_start` (default 10) is its cap on the first sending day and `warmup_step_per_day` (default 3) is added each day until `daily_cap` is reached (`warmup_start: 0` turns it off); the response reports today's cap as `daily_cap_today` beside a `warmup` block. A sequence step accepts `track_clicks` (default true); with false the email keeps its real links and that step records no clicks. On the management plane, `accounts: ["apps@…"]` chooses the
project's marketing mailboxes (empty = every active marketing mailbox). `?dns=1` adds each mailbox's
SPF/DKIM/DMARC check.

## Public subscribe (browser)

`POST /email-lists/{list}/subscribe` — `{email, first_name?, last_name?, turnstile_token?}` with an
origin-restricted key. A Turnstile token is required when the project stores a Turnstile secret. Always
**202** with the same body, so the form never reveals who is already on the list or who unsubscribed.
5 requests per IP per hour; at most 3 confirmation emails per address per day.
