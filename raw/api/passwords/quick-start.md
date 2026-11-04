---
sidebar_position: 2
title: Password manager — quick start
sidebar_label: Quick start
description: Give a FilesHub API key a password scope, then create, find, reveal, change and delete a password over the API, with curl and JavaScript examples.
keywords: [fileshub password api quick start, create password api, reveal password api, curl password manager, node password manager api]
last_update:
  date: 2026-10-23
  author: FilesHub team
---

# Quick start

Five minutes from a plain API key to a stored, revealed and rotated password. Base URL:
`https://fileshub.zaions.com/api/v1`. Every call sends your key in `X-API-Key`.

## 1. Give a key a password scope

A key has no password access until you give it one. Pick **one** of:

- **Dashboard:** Nova → Projects & API → **API Keys** → the key → Edit → **Password Access** = `Admin` (or
  `Own`) → Update. Leave every **Password Abilities** box ticked for full access.
- **Management API** (a token with `can_manage_passwords`):

```bash
curl -X PATCH https://fileshub.zaions.com/api/public/v1/projects/my-project/api-keys/42 \
  -H "Authorization: Bearer $FILESHUB_PAT" \
  -H "Content-Type: application/json" \
  -d '{"password_scope": "admin"}'
```

Which scope? `own` when each integration should see only what it stored itself; `admin` for the team's shared
logins (the ones you also manage in the dashboard). Details: [Access and scopes](./access-and-scopes.md).

## 2. Save a password

```bash
export FILESHUB_KEY=fh_live_...   # the key from step 1 — server side only

curl -s https://fileshub.zaions.com/api/v1/passwords \
  -H "X-API-Key: $FILESHUB_KEY" -H "Content-Type: application/json" \
  -d '{
    "title": "Domain registrar",
    "websites": ["registrar.example.com"],
    "username": "ops@acme.test",
    "password": "vKpqzt-mbw4hd-Xenfra",
    "totp_secret": "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP",
    "notes": "Renews every March.",
    "tags": ["domains", "billing"],
    "is_favorite": true
  }'
```

`201` returns the entry **without** the password; keep its `id`:

```json
{
  "data": {
    "id": "01m5mjhqhzm44rckzkca0anxf0",
    "project_id": 1,
    "title": "Domain registrar",
    "websites": ["https://registrar.example.com"],
    "username": "ops@acme.test",
    "notes": "Renews every March.",
    "tags": ["domains", "billing"],
    "is_favorite": true,
    "has_verification_code": true,
    "strength": { "score": 4, "label": "very strong" },
    "reused": false,
    "owner_scope": "admin",
    "created_via": "api",
    "password_changed_at": "2026-10-23T14:27:28+00:00",
    "last_revealed_at": null,
    "created_at": "2026-10-23T14:27:28+00:00",
    "updated_at": "2026-10-23T14:27:28+00:00",
    "deleted_at": null
  }
}
```

No password of your own? Ask FilesHub for a strong one first: `POST /passwords/generate` →
`{"data": {"password": "Fneuht-fguhgh-s3bitk", "strength": "very strong"}}`.

## 3. Find it

```bash
curl -s "https://fileshub.zaions.com/api/v1/passwords?website=registrar.example.com" -H "X-API-Key: $FILESHUB_KEY"
```

Search by `q` (title, username or website), `website` (host), `tag` or `favorite=1`.

## 4. Reveal the password and the current code

```bash
curl -s -X POST https://fileshub.zaions.com/api/v1/passwords/01m5mjhqhzm44rckzkca0anxf0/reveal \
  -H "X-API-Key: $FILESHUB_KEY"
```

```json
{
  "data": {
    "id": "01m5mjhqhzm44rckzkca0anxf0",
    "username": "ops@acme.test",
    "password": "vKpqzt-mbw4hd-Xenfra",
    "unreadable": false,
    "verification_code": { "code": "626093", "expires_in": 21 },
    "password_history": null
  }
}
```

`expires_in` is the seconds left on that code. Every reveal is written to the audit log.

## 5. Change, delete, restore

```bash
# New password — the old one moves into the history
curl -s -X PATCH https://fileshub.zaions.com/api/v1/passwords/01m5mjhqhzm44rckzkca0anxf0 \
  -H "X-API-Key: $FILESHUB_KEY" -H "Content-Type: application/json" -d '{"password": "Hqtrnw-5fmzky-pobcse"}'

# To Recently Deleted, then back
curl -s -X DELETE https://fileshub.zaions.com/api/v1/passwords/01m5mjhqhzm44rckzkca0anxf0 -H "X-API-Key: $FILESHUB_KEY"
curl -s -X POST https://fileshub.zaions.com/api/v1/passwords/01m5mjhqhzm44rckzkca0anxf0/restore -H "X-API-Key: $FILESHUB_KEY"
```

## The same in JavaScript (Node 18+)

```js
const BASE = 'https://fileshub.zaions.com/api/v1';
const headers = { 'X-API-Key': process.env.FILESHUB_KEY, 'Content-Type': 'application/json' };

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${json.message}`);
  return json.data;
}

const { password } = await call('POST', '/passwords/generate');
const entry = await call('POST', '/passwords', {
  title: 'Domain registrar',
  websites: ['registrar.example.com'],
  username: 'ops@acme.test',
  password,
});
const secret = await call('POST', `/passwords/${entry.id}/reveal`);
console.log(secret.username, secret.password);
```

:::warning Server side only
A key with a password scope can read passwords. Keep it in a server environment variable; never ship it in a
web page, a mobile app or a browser extension.
:::
