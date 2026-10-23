---
slug: /api/passwords
sidebar_position: 1
title: Password manager — overview
sidebar_label: Overview
description: The FilesHub password manager stores logins per project — websites, usernames, encrypted passwords, verification codes, notes and tags — and lets API keys with an own or admin password scope create, read, reveal and manage them.
keywords: [fileshub password manager, password manager api, store passwords api, team password vault api, totp api, api key scopes, /api/v1/passwords]
last_update:
  date: 2026-10-23
  author: FilesHub team
---

# Password manager

FilesHub keeps logins for your projects and lets your own code manage them over the API. Each entry looks
like an entry in iCloud Passwords: a title, its websites, a username, the password, an optional
verification-code setup key, notes, tags and a favourite flag.

:::info Availability
Added in backend **`2026.10.23.5`**. Check what is running with `GET https://fileshub.zaions.com/api/version`
(`backend_version`); on an older backend every `/api/v1/passwords` route answers 404.
:::

**Read next:** [Quick start](./quick-start.md) · [Access and scopes](./access-and-scopes.md) ·
[Endpoint reference](./endpoints.md) · [Using the dashboard](./dashboard.md)

## What an entry holds

| Field | Type | Notes |
|---|---|---|
| `title` | string, required, ≤ 191 | What you call it: "Domain registrar". |
| `websites` | list of strings, ≤ 20 | Normalised to `https://host[/path]`, de-duplicated. `registrar.example.com` becomes `https://registrar.example.com`. |
| `username` | string, ≤ 191 | The login name or email. Stored as plain text so you can search it. |
| `password` | string, required, ≤ 1,024 | **Encrypted at rest.** Never returned except by [reveal](./endpoints.md#reveal). |
| `totp_secret` | string | The verification-code (two-factor) setup key, as base32 (`JBSWY3DPEHPK3PXP…`) or the whole `otpauth://` link. **Encrypted.** FilesHub then returns the current 6-digit code on reveal, like an authenticator app. |
| `notes` | string, ≤ 10,000 | **Encrypted at rest**; returned with the entry's details. |
| `tags` | list of strings, ≤ 20, each ≤ 40 | For filtering: `["domains", "billing"]`. |
| `is_favorite` | boolean | Favourites sort first. |

FilesHub adds:

| Field | Meaning |
|---|---|
| `id` | The entry's public id (26 characters). Use it in every URL. |
| `project_id` | The FilesHub project the entry belongs to. |
| `strength` | `{score, label}`: zxcvbn score 0–4; label `weak`, `fair`, `strong` or `very strong`. |
| `reused` | `true` when another live entry in the same project has the same password. Computed on single-entry answers; `null` in lists. FilesHub compares a keyed fingerprint and never decrypts a password to do it. |
| `has_verification_code` | Whether a setup key is stored. |
| `owner_scope` | `own` or `admin` — who can reach it. See [Access and scopes](./access-and-scopes.md). |
| `created_via` | `api` or `dashboard`. |
| `password_changed_at`, `last_revealed_at`, `created_at`, `updated_at`, `deleted_at` | ISO 8601 times. |

**Password history.** Changing a password keeps the old one: the last **10** earlier passwords, encrypted,
returned by reveal with `history: true`.

**Recently Deleted.** Deleting an entry moves it to Recently Deleted. It can be restored, or removed for
good with a second, explicit call.

## Who can reach which password

Every API key starts with **no access** to the manager. You give a key one of two scopes:

| Scope | The key can reach |
|---|---|
| `none` (default) | Nothing. Every password route answers `403`. |
| `own` | Only the entries **this key created**, in its own project. No other key sees them through the API — not even an admin key. |
| `admin` | Entries created by **admin keys** or **in the dashboard**, in the key's project. Never an `own` key's entries. |
| `admin` + **every project** | The same, across **all** projects. |

And you can narrow either scope to some of five **abilities**: `list`, `reveal`, `create`, `update`,
`delete`. Full rules: [Access and scopes](./access-and-scopes.md).

```text
                    ┌────────────── project A ──────────────┐   ┌──── project B ────┐
own key K1   ──────▶│ entries K1 created                    │   │                   │
own key K2   ──────▶│ entries K2 created                    │   │                   │
admin key    ──────▶│ entries from admin keys + dashboard   │   │                   │
admin key + every project ──────────────────────────────────▶│ admin + dashboard │
                    └───────────────────────────────────────┘   └───────────────────┘
```

An entry a key cannot reach answers **`404 Not found`**, the same as an id that does not exist, so a key
can never learn that someone else's password is there.

## Security model

- Passwords, setup keys, notes and the password history are encrypted with the server's application key.
- Every create, change, delete, restore, permanent removal and **reveal** is written to the audit log with
  the entry id, the key and (for changes) the field names. A value is never logged.
- A key's password scope can only be granted by you in the dashboard, or over the Management API by a
  token holding `can_manage_passwords`.
- 🔴 **Use a password-scoped key from a server only.** Never put it in a browser or mobile bundle: anyone
  holding the key can do what its scope allows. Prefer a separate key for passwords, with only the abilities
  it needs (a read-only integration gets `list` and `reveal`, nothing else).
- If an entry can no longer be decrypted (for example after the application key was rotated), reveal
  answers `"password": null, "unreadable": true` instead of failing.

## Plans

Your own (internal) projects use the password manager without a plan. An external project answers
`402` until a password-manager plan is available for it; see [pricing](https://fileshub.zaions.com/pricing).
