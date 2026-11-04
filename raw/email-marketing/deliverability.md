---
sidebar_position: 8
title: Mailbox warm-up and deliverability
description: How FilesHub warms up every sending mailbox with persona conversations, measures real replies, tunes each mailbox's daily limit every night, and exposes the numbers and controls on the Management API.
keywords: [mailbox warm-up, email deliverability api, inbox placement, sending limits, bounce rate, complaint rate, warm-up personas, deliverability policy]
tags: [email-marketing]
last_update:
  date: 2026-10-20
  author: Ahsan Mahmood
---

# Mailbox warm-up and deliverability

Since backend `2026.10.20.1`. FilesHub sends from your own mailboxes, so their reputation is yours to keep.
Three server-side parts do that work, and the Management API exposes their numbers and controls.

## Warm-up, for every mailbox

Any mailbox with **Warm-up** switched on in Nova takes part, whatever its purpose. Between 08:00 and 20:00 a
mailbox sends at most one short plain-text note every 10 minutes, spread across the day. Each purpose has
its own ramp:

| Purpose | Notes per day (first day → step → most) | Share of threads answered |
|---|---|---|
| Marketing | 3 → +2 → 40 | 65% |
| Outreach | 2 → +1 → 20 | 50% |
| Transactional | 2 → +1 → 15 | 50% |
| Warm-up partner | replies only, up to 15 | 45% |

A **warm-up partner** is an extra inbox (for example a long-standing Gmail account). It only receives, reads
and answers warm-up notes. It never starts a thread and never sends campaign or transactional mail.

Each mailbox writes as a **persona** to a few regular correspondents. Every pair shares a story that moves
slowly through life chapters, and a thread goes back and forth 2–5 times using its last notes as memory.
Notes are written by AI through FilesHub's own AI routing, with a local fallback, and never contain links,
email addresses or markup. A reader opens each note 3–180 minutes after it arrives, marks it read and flagged
(Important on Gmail), moves it out of Spam if it landed there, and files it away. It touches only messages
carrying a warm-up token it sent.

Warm-up notes count toward a mailbox's daily limit.

## Measuring real engagement

Once an hour FilesHub reads only the `In-Reply-To` and `References` headers of new inbox messages on
marketing and outreach mailboxes, and marks the campaign send each reply answers (`replied_at`). Nothing in
the inbox is flagged, moved or marked read. Bounce and complaint reports are read from the same inboxes.

## The nightly tuner

At 02:30 each mailbox is measured over the policy window (7 days by default), and the tuner acts on the result:

- **Repeated failures** (3 sends in a row that the mailbox caused): a warm-up partner stops warming up; a
  marketing or outreach mailbox is paused from campaigns. Since `2026.10.21.1` a failure the recipient caused,
  such as an address that does not exist, a full mailbox or a reserved domain like `example.com`, neither
  counts nor breaks the run.
- **Trouble** (hard bounces over 2%, complaints over 0.1%, or warm-up notes landing in spam): a marketing or
  outreach mailbox's limit is cut to 75% (never below its floor) and it is paused for 48 hours. Its warm-up
  volume goes up.
- **Healthy and busy** (bounces under 1%, no complaints, 95%+ inbox, 80%+ of the limit used): the limit rises
  by 12%, at most once a week, up to the purpose's ceiling (marketing 150, outreach 40).

- **Ready for campaigns** (since `2026.10.21.2`): a warming marketing mailbox is approved for campaigns by
  itself once it has 14+ warm-up days, passing SPF/DKIM/DMARC, steady warm-up sends, inbox evidence and no
  failed send, and once its own warm-up notes reach recipients' inboxes at least 90% of the time. The owner
  is emailed; which product the mailbox sends for stays his choice.

Warm-up placement always means where a mailbox's **own** notes landed, which is its reputation.

**Transactional mailboxes never have their limit cut or their sending paused.** Only their warm-up volume
moves. A rate with too little evidence behind it is `null` and never triggers anything. Every change, from
the tuner, the API or Nova, is stored with its reason.

Since `2026.10.23.4` the server also runs the **weekly review** itself, once the newest review is seven days
old. It reads the same numbers as `GET /email-marketing/deliverability`, takes one bounded policy step (the
share of unconfirmed people per send is halved while a campaign mailbox bounces above 2%, and restored once
every mailbox is under 1%), writes a summary and records the review. The owner is emailed only with what a
person must do: failing DNS, a mailbox that cannot send, a notice that never arrived, the mailbox-check agent
silent for a day, a project that will not resume by itself, or a ready mailbox no product uses. Fixes the
system makes by itself are logged, never emailed.

## API

All endpoints are on the Management plane (`https://fileshub.zaions.com/api/public/v1`, `Authorization:
Bearer fh_pat_…`). They need `can_manage_email_marketing` **and** a token for every project, because the
mailboxes serve every product; otherwise they answer 403. An unknown id answers 404.

| Method and path | What it does |
|---|---|
| `GET /email-marketing/deliverability` | Every mailbox: settings, warm-up state, persona, and `last_7_days` / `last_30_days` numbers. Also capacity, the policy with defaults and bounds, the last 30 tuning events, the last review and, since `2026.10.21.1`, `notices` (the last 10 notices sent to the owner, with status and error). `?dns=1` adds SPF, DKIM and DMARC per domain. |
| `PATCH /email-marketing/mailboxes/{id}` | Change `daily_limit`, `warmup_enabled`, `warmup_max` (1–100 or null), `marketing_paused_until` (within 30 days, or null) or `is_active`. `reason` is required and stored with each change. A marketing or outreach limit must sit inside the policy's floor and ceiling. |
| `GET /email-marketing/deliverability/policy` | The rules in force, the defaults and each rule's bounds. |
| `PUT /email-marketing/deliverability/policy` | `{"rules": {…}, "notes": "…"}` — change some or all rules. One bad rule refuses the whole request (`INVALID_RULES`, each problem in `error.details.rules`). The version goes up by one. |
| `POST /email-marketing/deliverability/reviews` | `{"summary": "…", "model": "…", "changes_applied": […]}` records a review → 201 with `next_review_due`. |
| `GET /email-marketing/deliverability/reviews` | The latest reviews, newest first: `id`, `at`, `summary`, `changes_applied`, `model`, `reviewed_by`. `?limit=` 1–50 (default 10). Since `2026.10.23.4`. |
| `POST /email-marketing/deliverability/reviews/run` | Runs the server's own weekly review now. `{"dry_run": true}` answers what it would find and change (200) and saves and sends nothing; otherwise 201 with `review_id`, `summary`, `model`, `changes`, `owner_actions` and `notified`. Since `2026.10.23.4`. |
| `GET /email-marketing/warmup/personas` | Personas, relationships (kind, chapter, story so far), and the available kinds and life arcs. |
| `PATCH /email-marketing/warmup/personas/{id}` | `display_name`, `bio`, `voice`, `interests` (up to 5), `timezone`. Plain text only. |
| `PATCH /email-marketing/warmup/relationships/{id}` | `kind`, `chapter`, `story_summary`. Plain text only. |

The per-mailbox numbers come straight from the send and warm-up records:

- `campaign`: `sent`, `failed`, `bounced`, `complained`, `opened`, `clicked`, `replied`, `unsubscribed`, and
  `bounce_rate`, `complaint_rate`, `reply_rate`, `click_rate` (null below `min_sends_for_rates` sends).
- `warmup`: `sent`, `received`, `found_inbox`, `found_spam`, `rescued`, `not_found`, `replied`, `inbox_share`
  (null below `min_found_for_inbox_share`).
- `utilisation` (sends a day ÷ limit), `failure_streak` and `last_failure`.

The older `GET /email-marketing/warmup` still answers. Since this release its `ramp` is the per-purpose map
shown above, and its rows include every mailbox in warm-up.

## In Nova

**Dashboards → Mailbox overview** (since `2026.10.21.1`) lists every mailbox with its purpose, status, daily
limit, sent today, and sends in the last 1, 3, 7, 14, 21, 30, 60, 90, 180 and 360 days. Filter by
**Purpose**, and choose **What to count**: all real mail, marketing mail, other mail or warm-up notes. Open a
mailbox for its **Sending history & health** panel, which gives the status and its reason in plain words, the
week's and month's numbers, sends per window, the last changes and its persona.

## What to expect

Warm-up replies come from your own network. They help inbox placement but are not engagement. Real
recipients decide your reputation: keep hard bounces under 2% and complaints well under 0.3%, the ceiling
Gmail and Yahoo enforce for bulk senders, and expect cold outreach to draw a few percent of replies. A
healthy mailbox carries roughly 50–150 cold emails a day after four to six weeks of warm-up, so a daily
volume in the thousands needs mailboxes spread over several domains.
