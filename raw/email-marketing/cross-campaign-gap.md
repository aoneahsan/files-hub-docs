---
sidebar_position: 5
title: The gap between campaigns
description: A person who received a campaign email gets no email from a different campaign for 20 days. Follow-ups of a campaign already running for that person keep their own timing.
keywords: [cross campaign gap, email frequency cap, 20 day gap, wait_reason cross_campaign_gap, will_wait_for_gap, cross_campaign_gap_days, email sequence follow up]
tags: [email-marketing]
last_update:
  date: 2026-10-04
  author: Ahsan Mahmood
---

# The gap between campaigns

A person who received a marketing email from one campaign gets no email from a **different** campaign for
`cross_campaign_gap_days`. The default is **20**, and it is one value for the whole account. `0` turns the
rule off. Live from `2026.10.04.4`.

A **campaign** is one sequence. Two sequences of the same project are different campaigns, and so are two
sequences of different projects. All tracks of one sequence are the same campaign.

## Follow-ups are not delayed

Once a campaign has sent a person its first email, that person is **in flow**. Every later email of the same
campaign goes on its own `delay_hours`, whatever another campaign did in the meantime. Each follow-up also
moves the date forward: another campaign can start 20 days after the **last** email of the flow.

## What a held email looks like

The check runs just before a campaign's first email to a person. If another campaign mailed that person
inside the gap, nothing is sent and no send slot or daily cap is used. The enrollment stays `active` and
carries:

| Field | Value |
|---|---|
| `wait_reason` | `cross_campaign_gap` |
| `wait_until` | The other campaign's send time plus the gap |
| `next_due_at` | `wait_until` plus up to six hours, so a whole batch does not land on one minute |

When it comes due, the check runs again. `GET /email-sequences/{sequence}/enrollments?waiting=gap` lists the
held enrollments, and each row shows `wait_reason` and `wait_until`.

Two campaigns due for the same person at the same moment: exactly one sends, and the other is held.

## What counts

| Send | Starts or extends the gap |
|---|---|
| Any accepted email of a sequence, first or follow-up | Yes |
| A failed send | No |
| A test send (`…/steps/{key}/test`) | No |
| A double opt-in confirmation | No |
| Transactional mail (`POST /emails/send`) | No |

## Enrolling is never refused

`POST /email-sequences/{sequence}/enroll` enrols people as before. The response gains `will_wait_for_gap`:
how many of them got another campaign's email inside the gap, so their first email will wait.

```json
{ "success": true, "data": { "enrolled": 999, "already": 0, "refused_suppressed": 4, "refused_status": 0, "will_wait_for_gap": 45 } }
```

## Reading and changing the setting

Every project's `GET /email-marketing/settings` returns `cross_campaign_gap_days`, read-only there.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/public/v1/email-marketing/account-settings` | `{cross_campaign_gap_days}`. From `2026.10.04.5` |
| `PATCH` | `/api/public/v1/email-marketing/account-settings` | `{cross_campaign_gap_days: 0–365}`. Needs a token for every project. Out of range: 422 `GAP_OUT_OF_RANGE` |

In Nova it is Email Marketing → **Account Settings**.
