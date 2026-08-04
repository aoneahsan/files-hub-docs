---
sidebar_position: 5
title: Supabase account tokens
description: Read a Supabase account's personal access token (sbp_…) over the FilesHub Management API, behind its own can_read_supabase_tokens scope, plus the SUPABASE_ACCESS_TOKEN env line the Supabase CLI reads.
keywords: [supabase personal access token api, sbp_ token, supabase management api token, SUPABASE_ACCESS_TOKEN, can_read_supabase_tokens scope, supabase account vault, supabase cli login token, supabase account credentials]
last_update:
  date: 2026-08-01
  author: Ahsan Mahmood
---

# Supabase account tokens

A Supabase **personal access token** (`sbp_…`) belongs to an *account*, not to a project. It drives the
Supabase Management API and `supabase login --token`, so one token reaches every project that account
owns — including projects that do not exist yet.

That is why it is not part of the [Supabase project vault](./supabase-projects.md). It lives on a separate
**account** record, entered once for all the projects underneath it, and it is read back through the
endpoints on this page behind a scope of its own.

These endpoints are **read-only** (list, show, reveal). Creating and editing accounts stays in the FilesHub
admin by design — a vault is filled by a person, and read by a machine.

Base URL `https://fileshub.zaions.com/api/public/v1`, same `Authorization: Bearer fh_pat_...` as the rest
of the [Management API](./overview.md).

## The `can_read_supabase_tokens` scope

This is a **fifth, independent** boolean on the access token, **off by default** — and the important part
is what does *not* grant it:

> **`can_manage_supabase` does not imply `can_read_supabase_tokens`.** A token holding only
> `can_manage_supabase` receives `403` from every endpoint on this page.

The two scopes have different blast radii, so they are different switches:

| Scope | Reaches |
| --- | --- |
| `can_manage_supabase` | One project's credentials — its secret key, JWT secret, database password, S3 key |
| `can_read_supabase_tokens` | An account's PAT: **every** project that account owns, present and future, with authority to create and delete them |

Enable it per token in the FilesHub admin → **Access Tokens** → *Can Read Supabase Tokens*. A token without
it gets **`403 TOKEN_PERMISSION_DENIED`** (not the anti-enumeration `404`), because the scope is a property
of your own token — an honest error is more useful than pretending the resource does not exist:

```json
{ "error": { "code": "TOKEN_PERMISSION_DENIED",
  "message": "This access token cannot read Supabase personal access tokens. Enable \"Can Read Supabase Tokens\" on the token in Nova. Note that \"Can Manage Supabase\" does not grant this — a PAT reaches the whole account, so it is a separate switch.",
  "details": { "required_scope": "supabase_tokens" } } }
```

:::note `required_scope` is `supabase_tokens` today, `can_read_supabase_tokens` in the next release
That short label is what the live API returns as of 2026-08-04; a committed but undeployed change makes it
report the token's column name instead. Match on **both** and neither release breaks you — see
[`details.required_scope`](./endpoints.md#detailsrequired_scope--match-on-both-forms).
:::

`GET /token` reports the flag so you can check before calling:

```json
{ "data": { "name": "...", "all_projects": true, "can_manage_supabase": true, "can_read_supabase_tokens": false } }
```

## Resolving `{account}`

`{account}` accepts either the **numeric id** or the account's **login email**. The email is matched
case-insensitively, so paste it exactly as it appears in the Supabase dashboard. Unknown → `404 NOT_FOUND`.

## `GET /supabase-accounts`

List registered Supabase accounts. Query: `q` (matches email / label / organization), `active` (`true` /
`false`), `per_page` (default 20, max 50), `page`. Paginated `{ "data": [...], "meta": {...} }`. Each item
is the **safe summary** — never the token, only a `has` flag saying whether a reveal would return one:

```json
{
  "data": [
    {
      "id": 1,
      "email": "you@example.com",
      "label": "main free-tier account",
      "organization": "My Org",
      "is_active": true,
      "has": { "personal_access_token": true },
      "projects_count": 2,
      "last_revealed_at": null,
      "created_at": "2026-08-01T00:00:00+00:00"
    }
  ],
  "meta": { "current_page": 1, "per_page": 20, "total": 1, "last_page": 1 }
}
```

`projects_count` is what makes the blast radius visible before you ask for the token: it is the number of
registered Supabase projects a reveal of this account would reach.

## `GET /supabase-accounts/{account}`

One account: the summary above **plus** `notes`, the account's `dashboard` pages, and the `projects`
registered under it. Still **no token value**.

```json
{
  "data": {
    "id": 1, "email": "you@example.com", "label": "main free-tier account",
    "organization": "My Org", "is_active": true,
    "has": { "personal_access_token": true },
    "projects_count": 2, "last_revealed_at": null, "created_at": "...",
    "notes": "Free tier — two projects, keep-alive on both.",
    "dashboard": {
      "account": "https://supabase.com/dashboard/account/me",
      "tokens": "https://supabase.com/dashboard/account/tokens",
      "organizations": "https://supabase.com/dashboard/org"
    },
    "projects": [
      {
        "id": 1, "name": "my-app", "ref": "abcdefghijklmnop",
        "url": "https://abcdefghijklmnop.supabase.co", "is_active": true,
        "credentials_via": "/api/public/v1/supabase-projects/1"
      }
    ]
  }
}
```

`credentials_via` points at each project's own vault entry, which is a **different** scope
(`can_manage_supabase`) — the account endpoints never return a project's keys, and the project endpoints
never return the account's token.

## `POST /supabase-accounts/{account}/reveal`

Everything from the show response **plus the personal access token plus the CLI env line**. This is the
call that hands out a live account-wide credential, so it is a `POST` and it is **recorded** (best-effort:
token name, IP, user-agent and which field names were revealed — never a value — with `last_revealed_at`
stamped on the account and every reveal listed in the FilesHub admin). The audit write is best-effort by
design: if it fails it is logged, but it never blocks the caller from receiving the credential they
legitimately requested.

```json
{
  "data": {
    "id": 1, "email": "you@example.com", "...": "everything from show, plus:",
    "secrets": { "personal_access_token": "sbp_..." },
    "env": { "cli": "SUPABASE_ACCESS_TOKEN=sbp_..." }
  }
}
```

Notes on the payload:

- **`env.cli` is the variable the Supabase CLI reads.** Export it and `supabase link`, `supabase db push`
  and `supabase functions deploy` work without an interactive `supabase login`. It is the only env block
  here, because an account-wide token belongs in no application's `.env`.
- **The block is emitted only when a token is stored**, so you never paste an empty assignment. Values that
  would break a `.env` parser are quoted and escaped for you.
- **An unreadable token comes back `null`.** If the stored value cannot be decrypted — for example it was
  saved under a since-rotated `APP_KEY` — the vault returns `null` rather than failing the whole call,
  while its `has` flag still reports it as present. Re-enter the value in the admin to fix it.
- **Supabase shows a PAT once, at creation.** If the vault's copy is wrong or missing, it cannot be
  recovered from Supabase — generate a new token at the `dashboard.tokens` URL above and store that.

## Errors

| HTTP | `code` | When |
| --- | --- | --- |
| 401 | `MISSING_ACCESS_TOKEN`, `INVALID_ACCESS_TOKEN_FORMAT`, `INVALID_ACCESS_TOKEN`, `TOKEN_REVOKED`, `TOKEN_EXPIRED` | Auth (see [Authentication](./authentication.md)) |
| 403 | `TOKEN_PERMISSION_DENIED` | The token lacks the `can_read_supabase_tokens` scope — including when it holds `can_manage_supabase` |
| 404 | `NOT_FOUND` | No Supabase account matches the given id or email |
| 429 | — | Over 120 requests/minute |
