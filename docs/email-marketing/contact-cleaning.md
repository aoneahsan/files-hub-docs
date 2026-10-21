---
sidebar_position: 9
title: Contact cleaning
description: How FilesHub checks every address in the shared contact pool before a campaign mails it — address rules, DNS, an AI review of company domains, bounce history and a mailbox check with the recipient's own server — and how a project paused for bounces resumes by itself.
keywords: [email list cleaning, email verification, mailbox check, bounce rate, disposable email, role address, catch-all, contact quality]
tags: [email-marketing]
last_update:
  date: 2026-10-21
  author: Ahsan Mahmood
---

# Contact cleaning

Since backend `2026.10.21.5`. Bounces come from addresses that no longer exist, and they hurt the sending
mailboxes for every product that shares them. So every person in the [people pool](./people-pool.md) gets a
verdict before any campaign mails them, and new imports are cleaned the same way without anyone asking.

## Verdicts

| Quality | Meaning | Mailed? |
|---|---|---|
| `unchecked` | Not looked at yet. The campaign engine holds the person until a verdict exists. | not yet |
| `valid` | The recipient's mail server confirmed the mailbox. | yes |
| `unverified` | Every check that could run passed, but the mailbox itself could not be confirmed (for example Yahoo-hosted mail, or a server that accepts every address). | yes |
| `risky` | Could receive mail, but likely to bounce or complain: a role mailbox (`info@`, `sales@`), a full mailbox, or a company domain whose mailed people mostly bounced. | only when the project turns on `send_to_risky` |
| `invalid` | Cannot receive mail. The person's global status becomes `invalid`, so no product mails them. | never |

## What is checked

1. **The address itself.** Shape, typo domains of the big providers (`gmial.com`), placeholders (`test@`,
   `example.com`), about 9,900 disposable-inbox domains, and role mailboxes.
2. **The domain's DNS**, looked up once per domain and refreshed every 30 days. No mail server, or a null MX,
   makes the address invalid. A failed lookup is never a verdict.
3. **An AI review of company domains.** Bought lists carry many addresses at companies that were acquired,
   renamed or closed. Their domains still answer DNS, but nobody reads the mail. Only bare domain names are
   sent, in batches. A domain the AI is unsure about changes nothing.
4. **Bounce history.** A company domain with at least 3 hard-bounced people, who are half or more of its mailed
   people, makes the rest risky.
5. **A mailbox check with the recipient's server.** FilesHub opens SMTP to the recipient's mail server, names
   the address, and hangs up before any message is sent. The check runs only a few times a minute per
   provider, and it detects servers that accept every address. It leaves a provider alone for six hours if
   that provider refuses the check. A self-test turns it off when the server cannot open port 25; the check
   agent below then asks instead.

People waiting in a campaign are checked first. People in a project paused for bounces come before them.

## A bounce pause clears itself

When a project's campaigns stop for hard bounces, the cleaner checks that project's waiting people first. Once
none of them is unchecked, the project resumes by itself and the owner is emailed. Bounces then count afresh
from `resumed_at`, and the same is true after a manual **Clear auto-pause**.

A second bounce pause within 14 days of a self-resume stays paused for a person. Complaint pauses are never
lifted automatically.

## The check agent

Many hosts block port 25. When the FilesHub server cannot open it, a check agent on another machine asks the
mail servers instead: `php artisan email:mailbox-check-agent`, run as a background service.

- It claims up to 1,000 people at a time. Only people whose last open question is the mailbox are claimed:
  unverified, with `probe_unavailable`.
- It reports the answers at 1,000, every five minutes and when it stops. It never touches the database.
- People waiting in a campaign go first.
- Yahoo-hosted mail is closed as unverifiable without asking.
- A claim that is never reported returns to the queue after two hours.
- Three inconclusive answers close a person as unverified.

The answers mean the same as the server's own check:

| Answer | Verdict |
|---|---|
| mailbox exists | valid, or unverified if the server accepts every address |
| does not exist | invalid |
| mailbox full | risky |
| refused or no answer (third time) | unverified |

## API

`GET /email-marketing/contact-cleaning` on the Management plane (`https://fileshub.zaions.com/api/public/v1`,
`Authorization: Bearer fh_pat_…`). It needs `can_manage_email_marketing` and a token for every project;
otherwise it answers 403.

```json
{
  "data": {
    "people": { "total": 115168, "checked": 41200, "sendable": 36950,
      "by_quality": { "unchecked": 73968, "valid": 21400, "unverified": 15550, "risky": 1800, "invalid": 2450 } },
    "top_reasons": [ { "quality": "invalid", "reasons": ["mailbox_missing"], "people": 1210 } ],
    "domains": { "known": 9120, "business": 8400, "ai_reviewed": 3200, "ai_dead": 410, "no_mail_server": 260 },
    "mailbox_checks": { "enabled": true, "available": false, "checked_at": "2026-10-21T10:00:00+00:00",
      "detail": "This server cannot open port 25 (blocked by the host); mailbox checks are off.",
      "agent": { "online": true, "last_seen_at": "2026-10-21T13:05:00+00:00", "checked_24h": 3100, "waiting": 61200 } },
    "bounce_paused_projects": [ { "project": "rentparty", "people_waiting_for_a_check": 0, "resumes_by_itself": true } ]
  }
}
```

`POST /email-marketing/mailbox-checks/claim` with `{"size": 1000}` answers `{"data": {"items": [{person_id, email,
domain, mail_host, provider, accepts_all}], "claim_minutes": 120}}`. `POST /email-marketing/mailbox-checks/results`
takes `{"results": [{"person_id": 1, "result": "missing"}], "domains": [{"domain": "acme.io", "accepts_all": false}]}`
(at most 1,000 results; `result` is one of `valid`, `missing`, `full`, `retry`, `blocked`, `skipped`,
`unverifiable`) and answers the counts applied. Both need the same token as the report.

The numbers in the example are illustrative. Each one is a single aggregate query, and nothing is listed
person by person.

## In Nova

The first card on the dashboards, **Paused campaigns and mailbox checks**, shows each paused project in red:
- whether it resumes by itself or needs a person;
- a link to **Dashboards → Paused campaigns**, where **Clear auto-pause** sits on each row. That sidebar item
  shows a red count while any campaign is paused.

The card's last row says whether the check agent is online and how many people it checked in 24 hours.

**Email People** shows a **Quality** badge and has a **Quality** filter. A person's page lists the reasons and
when they were checked. **Allow mail again** also lifts an `invalid` stop; the address is checked again after
90 days.
