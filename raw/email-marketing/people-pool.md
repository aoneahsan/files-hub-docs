---
sidebar_position: 4
title: The shared people pool
description: One pool of people for the whole FilesHub account — a contact imported once can join a list of any project without a second upload, with one history per person across products.
keywords: [email marketing people pool, shared contacts, fill a list from the pool, method pool import, new_contact consent basis, existing_person counter, email people api]
tags: [email-marketing]
last_update:
  date: 2026-10-04
  author: Ahsan Mahmood
---

# The shared people pool

A contact belongs to one project and one list. A **person** is one address for the whole account. Every
contact links to its person, so an address imported once can be used by any campaign of any project, and its
history reads across products.

Live from `2026.10.04.3`. The people and settings routes on this page are live from `2026.10.04.5`.

## What happens on import

Every way a contact is added (CSV, paste, a single add, the public subscribe form) goes through one
pipeline. It now finds or creates the person first.

- An address the pool already knows is **not an error**. The row is accepted into the list and also counted
  in **`existing_person`**. That counter sits inside `accepted`, so the counters still add up to `total_rows`.
- A known person is never overwritten. A later import only fills a name or phone that was empty and adds its
  tags. The consent basis and `source` stay those of the first import.
- `defaults.source` is a short label kept on the person, for example `contacts-batch-051`. Reports group by it.
- A CSV may map a `phone` column. It is kept on the person and never used to send.

## The `new_contact` basis

For a list you bought or were given: people you market to who did not sign up. Its footer line reads "the
LifeWell team thought it might be useful to you. If it is not, unsubscribe below and we will not write again."
(with the product's own brand name). It never says "you signed up". The four bases are `opt_in`, `legitimate_interest`, `existing_relationship`
and `new_contact`.

## Fill a list from the pool

`POST /email-lists/{list}/imports` with `method: "pool"` adds people to a list with no upload.

```bash
curl -X POST https://fileshub.zaions.com/api/public/v1/projects/clearhire/email-lists/01J9XK…/imports \
  -H "Authorization: Bearer fh_pat_xxx" -H "Content-Type: application/json" \
  -d '{"method":"pool","filter":{"tags":["batch-051"],"from_project":"lifewell"},
       "defaults":{"tags":["from-pool"]},"limit":1000,"dry_run":true}'
```

```json
{ "data": { "total_rows": 999, "accepted": 990, "duplicate": 0, "suppressed": 9, "existing_person": 990, "dry_run": true } }
```

| Field | Notes |
|---|---|
| `filter` | At least one of `tags` (any of them), `source`, `consent_basis` (a list), `from_project` (slug or id), `from_list` (id). Without one: 422 `pool_filter_required` |
| `limit` | Required, at most 5,000. When more people match, nothing is added: 422 `pool_filter_exceeds_limit` with `matched` |
| `dry_run` | `true` returns the counters and writes nothing. The count and the people added come from the same query |
| `defaults.tags` | Tags for the new contacts in this list |

People who are stopped everywhere, or suppressed in the target project, are counted under `suppressed` and
not added. Each new contact gets its own `contact_token` in the target project. `GET /email-imports/{import}`
shows `existing_person` and, for a pool import, `filter`.

🔴 **Reach.** A project key (`fh_live_`) draws only from people already in its own project, so it never reads
another project's contacts. A token (`fh_pat_`) draws from the projects it reaches; a token for every project
draws from the whole pool.

## People routes (management plane only)

These exist only at `https://fileshub.zaions.com/api/public/v1/…` with a `fh_pat_` token that has
`can_manage_email_marketing`. A token limited to some projects sees only people who are in one of them; a
person outside that reach answers 404 `PERSON_NOT_FOUND`.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/email-people` | `?source=&tag=&consent_basis=&global_status=&email=&sent_within_days=&not_sent_within_days=`, paginated |
| `GET` | `/email-people/{person}` | Identity, the projects and lists the person is in (`memberships`), and what is planned (`next`) |
| `GET` | `/email-people/{person}/history` | The timeline across products, newest first, paginated |
| `POST` | `/email-people/{person}/stop` | `{reason}` → `global_status: unsubscribed_all`. Audited |

A person: `id`, `email`, `first_name`, `last_name`, `phone`, `consent_basis`, `source`, `tags`,
`global_status`, `last_marketing_sent_at`, `created_at`.

A history item has `at`, `kind` and the fields of that kind. Kinds: `imported`, `enrolled`, `email` (with
`sequence`, `step`, `subject`, `mailbox`, `status`), `clicked`, `unsubscribed`, `bounced`, `complained`,
`held` (a first email waiting for the [gap](./cross-campaign-gap.md)) and `event` (a product event).
`GET /email-contacts/{contact}/history` on either plane returns the same timeline limited to one project.

## Stops that cross products

`global_status` is `active`, `bounced`, `complained`, `unsubscribed_all` or `erased`. Anything but `active`
means no project sends to the address: import counts it as `suppressed`, enrol as `refused_suppressed`.

| Event | Effect |
|---|---|
| Unsubscribe (one-click or the page's first button) | That product only |
| "Stop all mail from this sender" on the unsubscribe page | Every product (`unsubscribed_all`) |
| Hard bounce | Every product (`bounced`) |
| Spam complaint | Every product (`complained`) |
| Erasure | Every contact of the address in every project is erased; the person is marked `erased` |

A stop is lifted only in Nova (People → **Allow mail again**, with a reason). Importing the address again
changes nothing.
