---
sidebar_position: 4
title: Agent workflow — auto-configure a project's API key
description: Step-by-step recipe for an AI coding agent to map a local project to its FilesHub project and enforce origin restrictions on its API key using the Management API.
keywords: [ai agent fileshub, claude code fileshub, automate api key setup, origin restriction automation, fh_pat access token workflow, wire up api key from env]
last_update:
  date: 2026-07-18
  author: Ahsan Mahmood
---

# Agent workflow

This is the recipe an AI coding agent (Claude Code, Codex, …) follows to make sure a local project's
FilesHub API key is correct and properly origin-restricted. It needs one `fh_pat_` access token,
provided out-of-band as an environment variable (e.g. `FILESHUB_ACCESS_TOKEN`) — **never** hard-coded.

> The access token is a server/CLI secret. Read it from the environment, never write it into a repo,
> a commit, or shell history.

## The steps

**1. Confirm the token and its scope.**
```bash
curl -s https://fileshub.zaions.com/api/public/v1/token -H "Authorization: Bearer $FILESHUB_ACCESS_TOKEN"
```

**2. Find the key in the local project.** Read the project's `.env` (or equivalent) for the FilesHub
key — commonly `VITE_FILESHUB_API_KEY`, `FILESHUB_API_KEY`, or `VITE_FILES_HUB_API_KEY`.

**3. If a key exists, look it up.**
```bash
curl -s -X POST https://fileshub.zaions.com/api/public/v1/api-keys/lookup \
  -H "Authorization: Bearer $FILESHUB_ACCESS_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"api_key\":\"$LOCAL_KEY\"}"
```
The response tells you the project, whether the key is `restricted`, and its current `origins`.

**4. Fix the restrictions if needed.** For a key that ships inside a frontend bundle, it must be
restricted to your own origins. Turn `restricted` on and add the canonical origins:
```bash
# restrict the key
curl -s -X PATCH ".../projects/$PROJECT/api-keys/$KEY_ID" \
  -H "Authorization: Bearer $FILESHUB_ACCESS_TOKEN" -H 'Content-Type: application/json' \
  -d '{"restricted":true}'

# allow the production host and local dev
curl -s -X POST ".../projects/$PROJECT/api-keys/$KEY_ID/origins" \
  -H "Authorization: Bearer $FILESHUB_ACCESS_TOKEN" -H 'Content-Type: application/json' \
  -d '{"type":"domain","value":"https://myapp.com"}'
curl -s -X POST ".../projects/$PROJECT/api-keys/$KEY_ID/origins" \
  -H "Authorization: Bearer $FILESHUB_ACCESS_TOKEN" -H 'Content-Type: application/json' \
  -d '{"type":"domain","value":"http://localhost:5173"}'
```

**5. If there is no key locally, create one.** Find the project (or create it), mint a key, and write
the returned plaintext to the project's `.env`:
```bash
# find by name
curl -s ".../projects?q=my-web-app" -H "Authorization: Bearer $FILESHUB_ACCESS_TOKEN"
# or create the project
curl -s -X POST .../projects -H "Authorization: Bearer $FILESHUB_ACCESS_TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"My Web App"}'
# mint a key (returns plaintext once)
curl -s -X POST ".../projects/$PROJECT/api-keys" \
  -H "Authorization: Bearer $FILESHUB_ACCESS_TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"web frontend","restricted":true}'
```

## Origins are scheme + port sensitive

FilesHub matches origins **exactly** — scheme and port included. Add each origin in the exact form the
browser sends:

- Production web: `https://myapp.com` (and `https://*.myapp.com` for subdomains).
- Local dev: `http://localhost:5173` for that port only, or `http://localhost:*` for any port.
- Capacitor Android: `https://localhost`. Capacitor iOS: `capacitor://localhost`.

`http://` is accepted only for local hosts; a public host must be `https://`. A duplicate returns
`409`, so adding the same origin twice is safe to attempt. Full policy:
[API key restrictions](../getting-started/api-key-restrictions.md).

## Verify

After changes, `lookup` again (or `GET .../origins`) and confirm `restricted` is `true` with the
origins you expect. Then the frontend key is safe to ship: it only works from your own app.
