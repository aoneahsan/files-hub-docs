---
sidebar_position: 2
title: Authentication
description: FilesHub authenticates every request with an X-API-Key header. Keys are per project, carry read and write permissions, and can be restricted to specific web origins or mobile app ids.
keywords: [fileshub authentication, x-api-key, api key permissions, read write key, origin restriction, x-app-id, api key security]
last_update:
  date: 2026-07-14
  author: Ahsan Mahmood
---

# Authentication

**Every FilesHub request is authenticated with an `X-API-Key` header carrying a per-project key.** There are no user logins or OAuth tokens in the object API — the key identifies the project, its permissions, and its restrictions.

```http
X-API-Key: fh_live_xxxxxxxxxxxxxxxx
```

## Key types

| Prefix | Use |
|---|---|
| `fh_live_…` | Production traffic. |
| `fh_test_…` | Development and testing against the same API surface. |

## Permissions & scopes

A key carries scopes:

- **`read`** — list objects and download objects, including `private` ones in the key's project; list jobs, templates, and schedules.
- **`write`** — upload and delete objects; manage templates and schedules.
- **`email`** — send email via the [email API](../api/emails-send).
- **`email_template`** — manage email templates (paired with `write`).
- **service scopes** — per-utility access (e.g. `converter`, `qr_code`); all enabled by default, so most keys reach every [utility](../api/utilities-index) unless a scope was turned off.

Give a key only what it needs. A public website that just renders already-uploaded public files needs no key at all to display them; a server that uploads needs `write`; a server that fetches private files needs `read`.

## Restrictions (ship a key in a frontend)

A key can be marked **restricted** so it only works from your own app — a web origin, an Android package (optionally pinned to its signing certificate), or an iOS bundle id. That lets you embed the key in a React or mobile app without a proxy backend.

```http title="Android request example"
X-API-Key: fh_live_xxx
X-App-Id: com.example.myapp
X-Android-Cert: AB:CD:...   # signing-cert SHA-256, when pinned
```

**[API key restrictions](api-key-restrictions)** covers the full setup — web origins and wildcards, Android package + certificate pinning (with `keytool` and a Kotlin snippet), iOS bundle ids, and where restrictions stop and a real backend is still needed. Manage restrictions per key in the Nova admin panel (**Projects → API Keys**).

## Keeping keys safe

1. **A `write` live key belongs on a server**, in an environment variable — never hardcoded in a public bundle. To use a key in a frontend, mark it **restricted** and scope it to your origins/app (see above), and keep its scopes minimal.
2. **Store keys in environment variables**, never in source control. (FilesHub's own repo keeps its secrets in a private repo for this reason.)
3. **Prefer read-only keys** wherever you don't upload or delete.
4. **Rotate keys** if one is exposed — create a new one in Nova and retire the old.

## What a missing or wrong key returns

- No `X-API-Key` on a write/list endpoint → `401` with `{ "message": "API key is required..." }`.
- A key without the needed permission → `403`.
- A restricted key used from a disallowed origin/app → `403`.

See [Errors & limits](../api/errors-and-limits) for the full table.
