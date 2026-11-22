---
title: Access keys (fh_usr_)
description: Make an fh_usr_ access key for a script or server of yours, scoped to the projects and actions it needs. How long keys last, when FilesHub shows one again, rotating with a 24-hour overlap, and revoking.
keywords: [fileshub access key, fh_usr_, personal api key, rotate access key, revoke access key, scopes]
tags: [other-apps]
last_update:
  date: 2026-11-22
  author: Ahsan Mahmood
---

# Access keys

**An access key lets one script or server of yours call the [person API](./api.md). You make it on
FilesHub under Account → Other apps → Access keys, pick the projects it can reach and what it may do, and
copy it once. It starts with `fh_usr_` and is followed by 43 random characters.**

Make one key per script, so you can stop one without touching the others.

:::info
Keys exist once an admin has switched on the API door. Until then the Access keys tab says the door is not
open yet and nothing can be made.
:::

## Make a key

1. Open **Account → Other apps → Access keys** and choose **Make an access key**.
2. **Name** it after the script that holds it, like "Receipts uploader (server)".
3. Pick the **projects** it can reach — only projects you belong to are offered.
4. Tick what it **may do** (below). You can't add to a key later; make a new one instead, so nothing quietly
   gains more reach.
5. Pick when it **stops working**: 30, 90 or 365 days, or never.
6. Copy the key from the slip. FilesHub emails you that a key was made; the key itself is never emailed.

With [two-step sign-in](./two-step-sign-in.md) on, making a key asks for a code from your authenticator
app in this sign-in. A recovery code or a remembered browser does not count.

## What a key may do

| Scope | Lets the key |
|---|---|
| `account:read` | See your name, email and plan |
| `projects:read` | See project names and which services they use |
| `files:read` | List files and make 5-minute download links |
| `files:delete` | Ask to delete a file. You say yes on FilesHub |
| `usage:read` | See usage and limits for this month |
| `email_log:read` | See who was sent what and whether it went. Never the message |
| `webhooks:read` | See your webhook endpoints and deliveries |

`files:write` (upload and rename) is not offered yet: it comes once your project's Files page on FilesHub
has those buttons.

A delete asked for in a project where you are a **viewer** is refused. In a project where you are an
**operator**, the delete waits for your yes — see [Deletes wait for you](./api.md#deletes-wait-for-you).

## How long a key lasts

- 30, 90 or 365 days. FilesHub emails you 7 days before a key ends.
- **Never** is offered only for see-only keys. A key that can ask for a delete always ends.
- A key also stops reaching a project the moment you stop belonging to it: its projects are checked
  against your memberships on every request.

## Seeing a key again

FilesHub keeps a sealed copy, so **Show again** works — but only within 10 minutes of a real Google
sign-in, plus a code typed after it when two-step sign-in is on. A page left open since this morning does
not count. Shown keys disappear after 60 seconds, and you can show keys at most 10 times an hour.

If a key ever can't be shown, revoke it and make a new one.

## Rotate

**Rotate** makes a new key with the same name, projects, scopes and end date. The new key works at once;
the old one keeps working for 24 hours, so you can swap it in without a gap. Like making a key, rotating
asks for an authenticator code in this sign-in when two-step sign-in is on.

## Revoke

**Revoke** stops a key at once: the next request with it gets `401 invalid_key`. Any delete it asked for
that is still waiting is cancelled.

An admin can also revoke a person's key from the admin panel.

## Check a key from a script

`GET /api/account/v1/token` tells a script which key it holds, without needing any scope:

```bash
curl -s https://fileshub.zaions.com/api/account/v1/token \
  -H "Authorization: Bearer $FILESHUB_KEY"
```

```json
{
  "data": {
    "name": "Receipts uploader (server)",
    "prefix": "fh_usr_k3Q9",
    "scopes": ["files:read", "files:delete", "usage:read"],
    "projects": ["01JZ8D2K4M6P8R0T2V4X6Y8A0C"],
    "expires_at": "2027-02-20T09:14:02+00:00"
  }
}
```

`expires_at` is `null` for a key that never ends.

## Keep it out of code

An access key is a secret. Keep it in your server's environment or secret store, never in a browser bundle,
a mobile app or a committed file. The person API is for your scripts and servers.
