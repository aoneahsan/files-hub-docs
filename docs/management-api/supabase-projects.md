---
sidebar_position: 5
title: Supabase project vault
description: Read and reveal a Supabase project's full credential set — API keys, JWT secret, Postgres connection details, and S3 keys — over the FilesHub Management API, plus ready-to-paste React, Node and Laravel .env blocks.
keywords: [supabase credentials api, supabase vault, reveal supabase keys, supabase service_role key api, supabase connection string, can_manage_supabase scope, wire supabase into react node laravel, supabase project management api]
last_update:
  date: 2026-07-22
  author: Ahsan Mahmood
---

# Supabase project vault

FilesHub can also act as a **credential vault for your Supabase projects**. Register a project once in
the FilesHub admin — its API keys, JWT secret, Postgres connection details, and S3 keys — and this part
of the Management API reads them back, on demand, over one authenticated call: everything a coding agent
needs to wire that Supabase project into a React, Node or Laravel app.

These endpoints are **read-only** (list, show, reveal). Creating and editing Supabase projects stays in
the FilesHub admin by design — a vault is filled by a person, and read by a machine.

Base URL `https://fileshub.zaions.com/api/public/v1`, same `Authorization: Bearer fh_pat_...` as the rest
of the [Management API](./overview.md).

## The `can_manage_supabase` scope

Supabase projects are **account-wide** — they belong to no FilesHub project — so they are **not** gated by
the token's project scope (`all_projects` / a project subset). They are gated by a **separate** boolean on
the access token: **`can_manage_supabase`**, which is **off by default**.

- Enable it per token in the FilesHub admin → **Access Tokens** → *Can Manage Supabase*.
- A token without it gets **`403 TOKEN_PERMISSION_DENIED`** (not the anti-enumeration `404`), because the
  scope is a property of your own token — an honest error is more useful than pretending the resource does
  not exist:

```json
{ "error": { "code": "TOKEN_PERMISSION_DENIED",
  "message": "This access token cannot manage Supabase projects. Enable \"Can Manage Supabase\" on the token in Nova.",
  "details": { "required_scope": "supabase_projects" } } }
```

`GET /token` reports the flag so you can check before calling:

```json
{ "data": { "name": "...", "all_projects": true, "can_manage_supabase": true, "expires_at": null } }
```

## Resolving `{supabaseProject}`

`{supabaseProject}` accepts either the **numeric id** or the **project ref** — the `<ref>` label of a
`https://<ref>.supabase.co` URL. Unknown → `404 NOT_FOUND`.

## `GET /supabase-projects`

List registered Supabase projects. Query: `q` (matches name / url / organization), `active` (`true` /
`false`, filters on the keep-alive flag), `per_page` (default 20, max 50), `page`. Paginated
`{ "data": [...], "meta": {...} }`. Each item is the **safe summary** — no secret values, only `has` flags
saying which secrets a reveal would return:

```json
{
  "data": [
    {
      "id": 1,
      "name": "my-app",
      "ref": "abcdefghijklmnop",
      "url": "https://abcdefghijklmnop.supabase.co",
      "organization": "My Org",
      "region": "ap-southeast-1",
      "account_email": "you@example.com",
      "is_active": true,
      "keepalive": { "last_run_at": "2026-07-22T00:00:00+00:00", "last_status": "ok" },
      "has": {
        "service_key": true, "legacy_service_role_key": false, "jwt_secret": true,
        "db_password": true, "db_url_direct": false, "db_url_session_pooler": true,
        "db_url_transaction_pooler": false, "s3_secret_access_key": false
      },
      "last_revealed_at": null,
      "created_at": "2026-07-18T00:00:00+00:00"
    }
  ],
  "meta": { "current_page": 1, "per_page": 20, "total": 1, "last_page": 1 }
}
```

Presence in `has` is tested **without decrypting**, so a secret that was stored under a rotated `APP_KEY`
still reports `true` — see the note under [reveal](#post-supabase-projectssupabaseprojectreveal).

## `GET /supabase-projects/{supabaseProject}`

One project: the summary above **plus** `notes`, the derived `endpoints`, and the non-secret `config`
(public keys, and the database / S3 coordinates without their secrets). Still **no secret values**.

```json
{
  "data": {
    "id": 1, "name": "my-app", "ref": "abcdefghijklmnop", "url": "https://abcdefghijklmnop.supabase.co",
    "organization": "My Org", "region": "ap-southeast-1", "account_email": "you@example.com",
    "is_active": true, "keepalive": { "last_run_at": "...", "last_status": "ok" },
    "has": { "service_key": true, "jwt_secret": true, "db_password": true, "...": false },
    "last_revealed_at": null, "created_at": "...",
    "notes": "Used by my-app's web + worker.",
    "endpoints": {
      "api": "https://abcdefghijklmnop.supabase.co",
      "rest": "https://abcdefghijklmnop.supabase.co/rest/v1",
      "auth": "https://abcdefghijklmnop.supabase.co/auth/v1",
      "storage": "https://abcdefghijklmnop.supabase.co/storage/v1",
      "graphql": "https://abcdefghijklmnop.supabase.co/graphql/v1",
      "functions": "https://abcdefghijklmnop.supabase.co/functions/v1",
      "realtime": "wss://abcdefghijklmnop.supabase.co/realtime/v1",
      "dashboard": "https://supabase.com/dashboard/project/abcdefghijklmnop"
    },
    "config": {
      "publishable_key": "sb_publishable_...",
      "legacy_anon_key": null,
      "database": { "host": "db.abcdefghijklmnop.supabase.co", "port": 5432, "database": "postgres", "user": "postgres" },
      "storage_s3": { "endpoint": null, "region": null, "access_key_id": null }
    }
  }
}
```

Endpoints are **derived from the project URL**, not stored, so they cannot drift. `dashboard` is `null`
when the URL has no inferable project ref (a self-hosted or custom-domain project); `realtime` is derived
from the URL's **host**, so it is present for those too and is `null` only when the URL has no parseable
host.

## `POST /supabase-projects/{supabaseProject}/reveal`

Everything from the show response **plus every stored secret plus ready-to-paste `.env` blocks**. This is
the call that hands out live credentials, so it is a `POST` and it is **recorded** (best-effort: token
name, IP, user-agent and which field names were revealed — never a value — with `last_revealed_at`
stamped on the project and every reveal listed in the FilesHub admin). The audit write is best-effort by
design: if it fails it is logged, but it never blocks the caller from receiving the credentials they
legitimately requested.

```json
{
  "data": {
    "id": 1, "name": "my-app", "...": "everything from show, plus:",
    "secrets": {
      "api": { "secret_key": "sb_secret_...", "legacy_service_role_key": null, "jwt_secret": "super-secret-jwt" },
      "database": {
        "password": "the-db-password",
        "url_direct": null,
        "url_session_pooler": "postgresql://postgres.abcdefghijklmnop:...@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres",
        "url_transaction_pooler": null
      },
      "storage_s3": { "secret_access_key": null }
    },
    "env": {
      "react_vite": "VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co\nVITE_SUPABASE_ANON_KEY=sb_publishable_...",
      "node": "SUPABASE_URL=https://abcdefghijklmnop.supabase.co\nSUPABASE_ANON_KEY=sb_publishable_...\nSUPABASE_SERVICE_ROLE_KEY=sb_secret_...\nSUPABASE_JWT_SECRET=super-secret-jwt\nDATABASE_URL=postgresql://...",
      "laravel": "DB_CONNECTION=pgsql\nDB_HOST=db.abcdefghijklmnop.supabase.co\nDB_PORT=5432\nDB_DATABASE=postgres\nDB_USERNAME=postgres\nDB_PASSWORD=\"the-db-password\"\nSUPABASE_URL=https://abcdefghijklmnop.supabase.co\nSUPABASE_SECRET_KEY=sb_secret_..."
    }
  }
}
```

Notes on the payload:

- **`env` blocks are built from whatever the vault holds.** A line is emitted only when its value exists,
  and a block with no lines at all is dropped — so you never paste an empty assignment. Values that would
  break a `.env` parser (spaces, `#`, `$`, quotes) are quoted and escaped for you (see the Laravel
  `DB_PASSWORD` above).
- **The Laravel block prefers the discrete DB components** you entered; if those are blank it decomposes a
  stored session-pooler (then direct) connection URI into `DB_*` lines.
- **An unreadable secret comes back `null`.** If a stored value cannot be decrypted — for example it was
  saved under a since-rotated `APP_KEY` — the vault returns `null` for that field rather than failing the
  whole call, while its `has` flag still reports it as present. Re-enter the value in the admin to fix it.

## Errors

| HTTP | `code` | When |
| --- | --- | --- |
| 401 | `MISSING_ACCESS_TOKEN`, `INVALID_ACCESS_TOKEN_FORMAT`, `INVALID_ACCESS_TOKEN`, `TOKEN_REVOKED`, `TOKEN_EXPIRED` | Auth (see [Authentication](./authentication.md)) |
| 403 | `TOKEN_PERMISSION_DENIED` | The token lacks the `can_manage_supabase` scope |
| 404 | `NOT_FOUND` | No Supabase project matches the given id or ref |
| 429 | — | Over 120 requests/minute |
