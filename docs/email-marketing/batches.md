---
sidebar_position: 7
title: Contact batches
description: Each imported CSV becomes one numbered batch in the shared people pool. A batch is given to one product's campaign at a time, never to the same product twice, and every use is recorded with its results.
keywords: [contact batches, email batch, POST /email-batches, assign batch to campaign, batch_reuse_cooldown_days, already_known, email list rotation, cold email batches]
tags: [email-marketing]
last_update:
  date: 2026-10-05
  author: Ahsan Mahmood
---

# Contact batches

A **batch** is one imported CSV file. Its people enter the [shared people pool](./people-pool.md) with a
number, "Batch 12", and with no product yet. Later the batch is given to **one product's campaign**: its
people join that campaign's list and are enrolled. A batch goes to one product at a time, so several products
can run campaigns side by side without mailing the same people. Live from `2026.10.05.2`.

## One file, one batch

- A file holds at most **5,000 rows**. A bigger file is refused with a message to split it, and each part
  becomes its own batch.
- A person belongs to the **first batch they arrived in**. When a later file has an address that is already in
  the pool, the address is counted as `already_known` and left where it is.
- Every person in the batch gets the tag `batch-<number>`, the batch's `source` and its consent basis
  (default `new_contact`).
- The rows sum exactly to the file:

| Counter | Meaning |
|---|---|
| `added` | New people, now in this batch |
| `already_known` | Already in the pool, kept in their first batch |
| `duplicate` | Repeated inside this file |
| `invalid_syntax` | Not an email address |
| `no_mx` | The domain cannot receive mail |
| `suppressed` | Stopped everywhere: a hard bounce, a complaint or an erasure |

`GET /email-batches/{batch}/rejected` returns every row that was not added, as CSV.

## Giving a batch to a campaign

`POST /email-batches/{batch}/assign` with `{"sequence": "<campaign id>"}` is a **dry run**. It returns the
numbers and changes nothing. Send `"dry_run": false` to assign. The numbers come from the same query in both
calls, so the dry run shows exactly who will be added.

Assigning:

1. adds the batch's people to the campaign's list (people stopped everywhere are left out and counted);
2. enrols them in the campaign;
3. records the use: product, campaign, time, who did it, and what it added and enrolled.

Nothing is sent at that moment. Each product's daily cap, warm-up, pacing and send window, and the
[gap between campaigns](./cross-campaign-gap.md), decide when every email goes out.

### When a batch is refused

Each refusal is a `409` with its own code:

| Code | Why |
|---|---|
| `BATCH_IN_USE` | The batch is in another running campaign |
| `ALREADY_USED_FOR_PRODUCT` | The batch was already used for this product; a batch never reaches a product twice |
| `BATCH_COOLING` | Its last campaign finished recently; `details.available_again_at` says when it is free |
| `BATCH_RETIRED` | The batch was retired |
| `BATCH_IMPORTING` | The import has not finished |
| `BATCH_EMPTY` | The batch has no people |

`RECIPIENTS_EXCEED_MAX` (`422`) means the campaign's `max_recipients` would be passed; nothing is assigned.

## After the campaign

Every hour FilesHub refreshes each use's results from the [send log](./send-log.md): emails sent, people
reached, clicks, unsubscribes, bounces and complaints. Test sends are not counted. When the campaign is
finished, or none of the batch's people can still be sent an email, the use is **finished** and the batch
**cools down** for `batch_reuse_cooldown_days` (default **30**). After that, another product may use it.
People who stopped all mail, bounced or complained are left out of every later use.

A fill from the pool by tag or source never adds people whose batch is running for another product.

## Statuses

| Status | Meaning |
|---|---|
| `importing` | The file is being read |
| `available` | Ready for a campaign |
| `assigned` | In a running campaign |
| `cooling` | Its campaign finished; free again on `available_again_at` |
| `retired` | Never assigned again; its people and history stay |
| `failed` | The import stopped; `POST …/resume` continues from the row it reached |

## Endpoints

Management plane only, with a token for **every** project and `can_manage_email_marketing`
(`Authorization: Bearer fh_pat_…`, base `https://fileshub.zaions.com/api/public/v1`).

| Method | Path | Does |
|---|---|---|
| `GET` | `/email-batches?status=` | Lists batches, newest first, [paginated](../api/pagination.md) |
| `POST` | `/email-batches` | `{object, label?, source?, consent_basis?, tags?, column_map?}`: a **private** uploaded CSV becomes the next batch. `201` when finished, `202` while a larger file is still importing |
| `GET` | `/email-batches/{batch}` | The batch, its import counters and every use with its results |
| `GET` | `/email-batches/{batch}/rejected` | Rows not added, as CSV |
| `POST` | `/email-batches/{batch}/assign` | `{sequence, dry_run?}`, a dry run unless `dry_run` is `false` |
| `POST` | `/email-batches/{batch}/resume` | Continues a failed import, or an assignment that stopped while enrolling |
| `POST` | `/email-batches/{batch}/retire` | Never assign this batch again |

`GET` and `PATCH /email-marketing/account-settings` read and set `batch_reuse_cooldown_days` (0 to 365)
next to `cross_campaign_gap_days`.

In Nova the same flow is **Email Marketing → Batches**, with the actions *Import CSV as a new batch*,
*Assign to campaign* (*Only count* is on by default), *Resume* and *Retire*.

## Earlier imports

People imported into a list before batches existed were given one batch per import. Each of those batches is
recorded as used by that list's product and the campaign that enrolled them, so the history is complete.
People who joined through a subscribe form or were added by hand have no batch.
