---
sidebar_position: 1
title: Management API overview
description: The FilesHub Public Management API lets a trusted server or AI coding agent create projects, mint and rotate per-project API keys, configure origin restrictions, and read a project's stored credentials using one account-wide access token.
keywords: [fileshub management api, access token, fh_pat, create api key programmatically, rotate api key, manage origins, project vault, ai agent, claude code, automate api keys]
last_update:
  date: 2026-08-04
  author: Ahsan Mahmood
---

# Management API overview

The **Public Management API** is a server-side control plane for your FilesHub account. Where the
[data API](../api/overview.md) uses a per-project `fh_live_` key to store files and send email, the
management API uses one account-wide **access token** (`fh_pat_`) to *administer* projects and their
keys: create a project, mint an API key, reveal or rotate it, and lock it down with origin
restrictions — all over HTTP, no dashboard clicks.

It exists so an AI coding agent (Claude Code, Codex, …) can wire up a local project end-to-end:
identify which FilesHub project a local `.env` key belongs to, and make sure that key is properly
origin-restricted before it ships in a frontend bundle.

- **Base URL:** `https://fileshub.zaions.com/api/public/v1`
- **Auth:** `Authorization: Bearer fh_pat_...` (or `X-Access-Token: fh_pat_...`)
- **Format:** JSON in, JSON out. Success is `{"data": ...}`; errors are `{"error": {"code", "message"}}`.

## Two token families — do not mix them

| Token | Prefix | Where it goes | What it does |
| --- | --- | --- | --- |
| **API key** | `fh_live_` | A project's `.env`; may ship in a browser bundle **only when origin-restricted** | Data plane — upload files, send email, call utilities (`/api/v1/*`) |
| **Access token** | `fh_pat_` | A server or CLI secret **only** — never a browser, never a committed file | Management plane — create/rotate/reveal keys, manage origins, manage projects (`/api/public/v1/*`) |

An `fh_live_` API key is rejected by the management plane (`INVALID_ACCESS_TOKEN_FORMAT`), and an
`fh_pat_` access token does nothing on the data plane. The management plane sends **no CORS headers**
— it is not callable from a browser by design.

## Scope

An access token either covers **all projects** (existing *and* future — the default) or is limited to
a chosen set. A project the token does not cover is indistinguishable from one that does not exist:
both return **404**, never 403. Create a token and set its scope in the FilesHub admin under
**Access Tokens**.

**Four separate booleans, all off by default**, sit on their own axes rather than on the project scope. A
token missing one gets a `403` naming it, not a `404`:

| Flag | Gates |
| --- | --- |
| `can_read_vault` | The [project vault](./project-vault.md) — metadata and **which** credentials exist, never a value |
| `can_reveal_vault` | The project vault's credential **values**, file bytes and `.env` blocks. Implies read |
| `can_manage_supabase` | The [Supabase project vault](./supabase-projects.md) — account-wide, so the project scope cannot express it |
| `can_read_supabase_tokens` | A [Supabase account's personal access token](./supabase-accounts.md) — the whole account, not one project |

Only `can_reveal_vault` implies another. In particular `can_manage_supabase` does **not** imply
`can_read_supabase_tokens`: one reaches one project's credentials, the other reaches the account that owns
every project it has, including ones that do not exist yet.

## What you can do

- **Projects** — list (with `?q=` search), create, read, update, delete.
- **API keys** — list, create (returns the secret once), read, update permissions/limits/`restricted`,
  delete, **rotate** (new secret, old one dies), **reveal** (re-read the stored secret).
- **Origins** — list, create, update, delete a key's allowed web origins / Android packages / iOS
  bundle ids, with the same scheme + port canonicalization the dashboard uses.
- **Lookup** — hand it an `fh_live_` key and get back its project and origin list.
- **Supabase projects** — list, read, and **reveal** a registered Supabase project's full credential
  set (keys, JWT secret, Postgres connection, S3 keys) plus ready-to-paste React/Node/Laravel `.env`
  blocks. Read-only, and gated by the `can_manage_supabase` scope. See
  [Supabase project vault](./supabase-projects.md).
- **Supabase accounts** — list, read, and **reveal** an account's personal access token (`sbp_…`) plus
  the `SUPABASE_ACCESS_TOKEN` line the Supabase CLI reads. Read-only, and gated by the separate
  `can_read_supabase_tokens` scope. See [Supabase account tokens](./supabase-accounts.md).
- **Project vault** — read, reveal **and write** every third-party credential, config file and identifier a
  project needs (Firebase, Google Cloud, Sentry, OneSignal, Cloudflare, signing keys, the store consoles and
  more), with ready-to-paste `.env` blocks, behind `can_read_vault` / `can_reveal_vault` /
  `can_write_vault`. Writing landed in `2026.08.20.1`; earlier pages describing the vault as read-only are
  stale. **Most projects are still unpopulated**; see [Project vault](./project-vault.md).

See [Authentication](./authentication.md), the [Endpoint reference](./endpoints.md), the
[Project vault](./project-vault.md), the [Supabase project vault](./supabase-projects.md),
[Supabase account tokens](./supabase-accounts.md), and the [Agent workflow](./agent-workflow.md).
