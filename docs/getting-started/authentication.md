---
sidebar_position: 2
title: Authentication
description: FilesHub authenticates every request with an X-API-Key header. Keys are per project, carry read and write permissions, and can be restricted to specific web origins or mobile app ids.
keywords: [fileshub authentication, x-api-key, api key permissions, read write key, origin restriction, x-app-id, api key security]
last_update:
  date: 2026-06-23
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

## Permissions

A key grants one or both of:

- **`read`** — list objects and download objects, including `private` ones in the key's project.
- **`write`** — upload new objects and delete existing ones.

Give a key only what it needs. A public website that just renders already-uploaded public files needs no key at all to display them; a server that uploads needs `write`; a server that fetches private files needs `read`.

## Restrictions (optional, recommended for production)

A key can be marked *restricted* so FilesHub validates where the request comes from:

- **Web** — the browser's `Origin` / `Referer` header is checked against the key's allowed-domains list. A leaked browser key is then useless from any other site.
- **Mobile** — send `X-App-Id` with your bundle id (e.g. `com.example.myapp`) and a platform user-agent. The key's allowed app-ids list is enforced.

```http title="Android request example"
X-API-Key: fh_live_xxx
X-App-Id: com.example.myapp
User-Agent: Mozilla/5.0 (Linux; Android 14) MyApp/1.0
```

Manage permissions and restrictions per key in the Nova admin panel (**Projects → API Keys**).

## Keeping keys safe

1. **Never ship a `write` live key in client-side code.** Anyone can read it from a bundle or network tab. Upload through your own backend, or use a restricted browser key scoped to your domain for low-risk public uploads.
2. **Store keys in environment variables**, never in source control. (FilesHub's own repo keeps its secrets in a private repo for this reason.)
3. **Prefer read-only keys** wherever you don't upload or delete.
4. **Rotate keys** if one is exposed — create a new one in Nova and retire the old.

## What a missing or wrong key returns

- No `X-API-Key` on a write/list endpoint → `401` with `{ "message": "API key is required..." }`.
- A key without the needed permission → `403`.
- A restricted key used from a disallowed origin/app → `403`.

See [Errors & limits](../api/errors-and-limits) for the full table.
