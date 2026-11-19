---
sidebar_position: 9
title: Social accounts
description: Record which email holds which social media account (LinkedIn profiles and company pages, X, Instagram, Facebook, YouTube and more) and which project each account belongs to, over the FilesHub Management API.
keywords: [social media account tracking, linkedin company page tracking, which email owns which account, social accounts per project, linkedin page limit, social media registry api, can_write_vault]
last_update:
  date: 2026-11-19
  author: Ahsan Mahmood
---

# Social accounts

A record of which email holds which social account, and which project each account belongs to. It works in
both directions: open a project to see its accounts and who holds them, or open an email to see every
account it holds, project by project.

It exists because LinkedIn lets one person make only a few company pages and then makes them wait about a
week. Pages get made through several people's emails, and this keeps track of whose.

Available since backend **`2026.11.19.1`**. In the dashboard: **Nova → Social Media**, and the **Social
Media** tab on every project.

## The three pieces

| Piece | What it is |
|---|---|
| **Social identity** | An email that holds accounts: yours or a team member's, with who holds it |
| **Social account** | One account on one platform, held through one identity: a LinkedIn profile, a LinkedIn company page, an X account, a YouTube channel |
| **Project link** | An account belongs to any number of projects, each with a role: `official`, `promotion` or `personal_brand` |

Nothing here is a secret. A login is a link to a dashboard **Password Manager** entry, returned as
`{public_id, title}`. The password itself never appears in any response.

An account's `status` is `active`, `pending`, `restricted` or `closed`. A closed account no longer counts as
"having" one, so its project shows up again in [projects without social media](#projects-without-social-media).

## Access

| Call | Token needs |
|---|---|
| Every read | `can_read_vault` (or `can_reveal_vault` / `can_write_vault`) |
| Every write | `can_write_vault` |
| `GET /social-platforms` | Any valid token |

Projects are seen through the token. A project the token can't reach is left out of every `projects` list.
Naming one in a write returns `404`, the same as a project that doesn't exist.

## Platforms

```http
GET /api/public/v1/social-platforms
```

Returns the platforms (20 today: LinkedIn, X, Facebook, Instagram, Threads, TikTok, YouTube and more), the
kinds each one offers, and `page_cooldown_days`, which is `7` for LinkedIn. Read it rather than hard-coding
the list. An X account is never a `page`, so asking for a kind the platform doesn't offer returns
`422 INVALID_KIND`.

## Record a new page the moment you make it

```http
POST /api/public/v1/social-identities
{"email": "pages.desk1@example.com", "held_by": "Team member A"}
```

```http
POST /api/public/v1/social-identities/pages.desk1@example.com/accounts
{
  "platform": "linkedin",
  "kind": "page",
  "name": "PregnancyPal",
  "url": "https://www.linkedin.com/company/pregnancypal",
  "created_on_platform_at": "2026-11-19",
  "projects": [{"project": "pregnancypal", "role": "official"}]
}
```

An identity is addressed by its `id` or its email; an account only by its `id`. A second identity with the
same email returns `409 SOCIAL_IDENTITY_ALREADY_EXISTS`, so `PATCH` that one instead.

`created_on_platform_at` on a LinkedIn page sets the identity's `next_linkedin_page_on`. That's `now`, or the
date the 7-day wait ends. Check it before choosing whose LinkedIn makes the next page.

## Read it either way

| From | Call |
|---|---|
| An email | `GET /social-identities/{identity}`: its accounts, each with its projects |
| A project | `GET /projects/{project}/social-accounts`: its accounts, each with the email and holder, plus `not_on` (platforms with no live account) |
| Search | `GET /social-identities?q=tilawah`: matches the email, holder, account names, handles, links and project names |

Both lists, `GET /social-identities` and `GET /social-accounts`, are paginated (`per_page`, `page`; `meta`
has the totals). They filter by `platform` and `project`, and accounts also by `kind`, `status` and `identity`.

## Change links

| Call | Effect |
|---|---|
| `PUT /social-accounts/{account}/projects` `{"projects": [{"project": "tilawah", "role": "promotion"}]}` | This account belongs to exactly these projects. `[]` detaches them. Links to projects your token can't see are left alone |
| `PUT /projects/{project}/social-accounts` `{"accounts": [{"account": "<id>", "role": "official"}]}` | This project has exactly these accounts |
| `PATCH /social-accounts/{account}` | Change any field. `projects`, when sent, replaces the set |
| `DELETE /social-accounts/{account}` | Removes the record and its links. To keep the history, set `"status": "closed"` instead |

## Projects without social media

```http
GET /api/public/v1/social-accounts/missing?lifecycle=production&missing_on=linkedin,facebook
```

The same lists as the two Nova lenses: **Production projects without social media** and **All projects
without social media** (`lifecycle=all`). With no `missing_on`, it lists projects with no live account at
all. With platforms, it lists projects with no live account on at least one of them. Each row has
`has_accounts_on` with counts per platform.

The full request and response shapes are in [`openapi.json`](https://fileshub-docs.zaions.com/openapi.json) under the
`Management API` tag.
