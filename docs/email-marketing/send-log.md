---
sidebar_position: 6
title: Send log and campaign report
description: Which email went to whom, from which campaign, step and mailbox, and what happened after — plus the stored campaign report with the waiting queue and a forecast date.
keywords: [email send log, campaign report api, email marketing sends, sequence report, waiting queue forecast, held step, per source report, gap_deferrals]
tags: [email-marketing]
last_update:
  date: 2026-10-04
  author: Ahsan Mahmood
---

# Send log and campaign report

Both are read-only and are built on the server. Routes on this page are live from `2026.10.04.5`, on both
planes, behind `can_manage_email_marketing`.

Every number is measured and names what it counts. There is no delivery rate and no open rate. "Sent" means
a mailbox accepted the email.

## Send log

`GET /email-marketing/sends` — one row per campaign send of the project, newest first, paginated.

| Filter | Notes |
|---|---|
| `sequence` | A sequence id |
| `step` | A step key, such as `A1` (with `sequence`) |
| `status` | `sent` or `failed` |
| `mailbox` | The sending address |
| `from`, `to` | Dates |
| `email` | One recipient address |
| `clicked` | `1` for sends with a click |
| `include_tests` | `1` to include test sends. They are left out by default |

```json
{ "id": "01M42Y…", "sent_at": "2026-10-04T09:20:11+00:00", "person": "01M42X…", "contact": "01M3R…",
  "email": "sara@example.org", "sequence": "01M3PV…", "step": "A1", "subject": "A calmer way to track your health",
  "mailbox": "apps@zaions.com", "status": "sent", "is_test": false, "error": null,
  "first_clicked_at": null, "unsubscribed_at": null, "bounced_at": null, "complained_at": null }
```

`unsubscribed_at`, `bounced_at` and `complained_at` are stamped on the send the event came from. A failed
send has `status: failed` and the mail server's `error`.

## Campaign report

`GET /email-sequences/{sequence}/report` returns the stored report of one sequence and when it was built.
It is rebuilt at 20 minutes past every hour, so reading it never aggregates the email log.

```json
{ "sequence": "01M3PV…", "built_at": "2026-10-04T09:20:03+00:00", "report": { "status": "active", "enrolled": 2038, "…": "…" } }
```

`report` is `null` until the first build after the sequence became active.

| Block | Fields |
|---|---|
| Header | `status`, `list`, `enrolled`, `cap_today`, `daily_cap`, `sent_today`, `next_send_at` |
| `queue` | `waiting_first`, `waiting_gap` (with `waiting_gap_earliest` and `waiting_gap_latest`), `in_flow`, `finished`, `stopped`. The five counts add up to `enrolled` |
| `forecast` | `date`: the day the last waiting person gets a first email, with its inputs (`waiting`, `cap_today`, `daily_cap`, `warmup_step_per_day`, `reaches_daily_cap_on`). It assumes every send is a first email. `null` when the campaign is not sending |
| `steps[]` | `key`, `due_now`, `waiting`, `sent`, `failed`, `unique_clicks`, `unsubscribes`, `bounces`, `complaints`, `delay_hours`, `held`, `held_until` |
| `days[]` | The last 30 sending days: `day`, `cap`, `sent`, `failed`, `gap_deferrals`, `report_status`, `flags` |
| `sources[]` | `source`, `sent`, `unique_clicks`, `unsubscribes`, grouped by the person's `source` label |

A step is **held** when its `delay_hours` is 720 (30 days) or more. That is how an email not yet approved is
kept back; `held_until` is the earliest date it would reach someone.

`GET /email-sequences/{sequence}` also carries `waiting_first`, `waiting_gap` and `in_flow` in `stats`, and
each [daily report](./api.md#daily-reports) gains `gap_deferrals`: first emails moved that day by the
[gap](./cross-campaign-gap.md).

## In Nova

| Screen | Where |
|---|---|
| Send Log | Email Marketing → Send Log. Filters for product, campaign, step, mailbox, result and dates; **Export CSV** |
| Campaign report | Email Marketing → Sequences → a sequence → Campaign report |
| Person page | Email Marketing → People → a person: what is next, and the timeline across products |
| Dashboard | Dashboards → Email marketing: a line per active campaign, the pool size, and what needs a look |
