---
sidebar_position: 2
title: Management API authentication
description: Authenticate the FilesHub Management API with an fh_pat_ access token via the Authorization Bearer header, and understand token scope, expiry, and revocation.
keywords: [fileshub access token, fh_pat, bearer token, authorization header, X-Access-Token, token expiry, revoke token, management api auth]
last_update:
  date: 2026-07-18
  author: Ahsan Mahmood
---

# Authentication

Every management request carries an access token:

```bash
curl https://fileshub.zaions.com/api/public/v1/token \
  -H "Authorization: Bearer fh_pat_XXXXXXXXXXXXXXXX"
```

The `X-Access-Token: fh_pat_...` header is accepted as a fallback when a bearer header is awkward to
set. **Prefer the bearer header** — and never put a `--token`-style value where a shell records it.

## Get a token

Create one in the FilesHub admin under **Access Tokens**: give it a name, decide whether it covers
**all projects** or a chosen set, and optionally set an expiry. The full token is shown on the token's
detail page (owner only) and is stored encrypted, so you can re-read it later — but treat it like a
password.

## Introspect first

An agent's first call should confirm the token works and learn its scope:

```bash
curl https://fileshub.zaions.com/api/public/v1/token -H "Authorization: Bearer $TOKEN"
```

```json
{
  "data": {
    "name": "Claude Code CLI",
    "token_prefix": "fh_pat_XzTJC7PU",
    "all_projects": true,
    "can_manage_supabase": true,
    "can_read_vault": true,
    "can_reveal_vault": false,
    "can_read_supabase_tokens": false,
    "expires_at": null,
    "last_used_at": "2026-07-18T09:12:44+00:00",
    "created_at": "2026-07-18T09:00:00+00:00"
  }
}
```

When the token is scoped to specific projects, `all_projects` is `false` and a `projects` array lists
exactly what it may manage.

Four further booleans are **separate, off-by-default axes**, independent of the project scope:

| Flag | Gates |
|---|---|
| `can_manage_supabase` | The [Supabase project vault](./supabase-projects.md) — account-wide, so the project scope cannot express it |
| `can_read_vault` | The [project vault](./project-vault.md): metadata, links, and **which** credentials exist — never a value |
| `can_reveal_vault` | The project vault's credential **values**, config-file bytes and `.env` blocks. Implies read |
| `can_read_supabase_tokens` | A [Supabase account's personal access token](./supabase-accounts.md) (`sbp_…`) — the whole account, not one project |

Only `can_reveal_vault` implies another (`can_read_vault`). The rest grant nothing but themselves — in
particular **`can_manage_supabase` does not grant `can_read_supabase_tokens`**: one reaches a project's
credentials, the other reaches the account that owns every project.

A token missing one of these gets **`403 TOKEN_PERMISSION_DENIED`** with `details.required_scope`, rather
than the anti-enumeration `404` used for resources — the scope is a property of your own token, so an
honest error is more useful than pretending the resource does not exist.

## Auth errors

Every failure is `401` with a machine-readable `code`:

| Code | Meaning |
| --- | --- |
| `MISSING_ACCESS_TOKEN` | No bearer / `X-Access-Token` header was sent. |
| `INVALID_ACCESS_TOKEN_FORMAT` | The value is malformed — e.g. you sent an `fh_live_` API key, which does not work here. |
| `INVALID_ACCESS_TOKEN` | The token is well-formed but unknown. |
| `TOKEN_REVOKED` | The token exists but is deactivated. Re-activate or mint a new one. |
| `TOKEN_EXPIRED` | The token is past its expiry. |

## Revoke

Turn a token **inactive** (or delete it) in the admin. The next request with it returns
`TOKEN_REVOKED` immediately — there is no cache to wait out.

## Rate limit

The management plane is limited to **120 requests per minute** per client. Beyond that you get a
standard `429`.
