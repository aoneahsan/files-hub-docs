---
sidebar_position: 4
title: Agent workflow — auto-configure a project's API key
description: Step-by-step recipe for an AI coding agent to map a local project to its FilesHub project and enforce origin restrictions on its API key using the Management API, checking global origins before adding duplicates.
keywords: [ai agent fileshub, claude code fileshub, automate api key setup, origin restriction automation, global origins check, fh_pat access token workflow, wire up api key from env]
last_update:
  date: 2026-07-30
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

**4. Check which origins are already global — before adding any.** Some origins are allowed
platform-wide and every restricted key already accepts them. Adding a per-key copy of one is a
duplicate that buys nothing, so ask first and add only what comes back `covered: false`:

```bash
curl -s -X POST .../global-origins/check \
  -H "Authorization: Bearer $FILESHUB_ACCESS_TOKEN" -H 'Content-Type: application/json' \
  -d '{"origins":[{"type":"domain","value":"https://myapp.com"},
                  {"type":"domain","value":"http://localhost:5173"},
                  {"type":"domain","value":"https://localhost"}]}'
```

**Do not compare `GET /global-origins` yourself.** Matching is not string equality, and both
mistakes are easy: `https://*.myapp.com` already covers `https://app.myapp.com`, while an apex rule
`https://myapp.com` covers **no** subdomain. Guessing either way leaves you with a redundant entry
or a key that 403s in production. The check endpoint runs the same matcher enforcement uses.

**5. Fix the restrictions.** For a key that ships inside a frontend bundle, it must be restricted to
your own origins. Turn `restricted` on and add **only the origins step 4 reported as not covered**:
```bash
# restrict the key
curl -s -X PATCH ".../projects/$PROJECT/api-keys/$KEY_ID" \
  -H "Authorization: Bearer $FILESHUB_ACCESS_TOKEN" -H 'Content-Type: application/json' \
  -d '{"restricted":true}'

# add each origin that came back covered:false — skip the rest
curl -s -X POST ".../projects/$PROJECT/api-keys/$KEY_ID/origins" \
  -H "Authorization: Bearer $FILESHUB_ACCESS_TOKEN" -H 'Content-Type: application/json' \
  -d '{"type":"domain","value":"https://myapp.com"}'
```
Adding a globally-covered origin anyway still succeeds — nothing rejects it — which is exactly why
the check is on you.

**6. If there is no key locally, create one.** Find the project (or create it), mint a key, and write
the returned plaintext to the project's `.env`:
```bash
# find by name
curl -s ".../projects?q=my-web-app" -H "Authorization: Bearer $FILESHUB_ACCESS_TOKEN"
# or create the project
curl -s -X POST .../projects -H "Authorization: Bearer $FILESHUB_ACCESS_TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"My Web App"}'
# mint a key (returns plaintext once, flat under data)
curl -s -X POST ".../projects/$PROJECT/api-keys" \
  -H "Authorization: Bearer $FILESHUB_ACCESS_TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"web frontend","can_read":true,"can_write":true,"restricted":true}'
# -> { "data": { "id": 7, ..., "plaintext_key": "fh_live_..." } }
```

Read `data.id` and `data.plaintext_key`. **Ask for every capability you want** — an omitted boolean
defaults to `false`.

**7. Keys used from a server, CLI or Flutter app.** Those clients send no `Origin`, so a restricted
key would refuse them. Set `allow_no_origin` instead of leaving the key unrestricted:
```bash
curl -s -X PATCH ".../projects/$PROJECT/api-keys/$KEY_ID" \
  -H "Authorization: Bearer $FILESHUB_ACCESS_TOKEN" -H 'Content-Type: application/json' \
  -d '{"restricted":true,"allow_no_origin":true}'
```
Browser traffic is still matched against the allowlist; header-less traffic is let through. Weaker
than an origin check (so is `curl`), far better than an unrestricted key.

**Browser extensions** use a `domain` origin with the extension scheme —
`chrome-extension://<id>`, where the host is the id (no port, no wildcard). Only Chrome ids are
stable; Firefox and Safari ids are per-install UUIDs.

## Origins are scheme + port sensitive

FilesHub matches origins **exactly** — scheme and port included. Add each origin in the exact form the
browser sends:

- Production web: `https://myapp.com` (and `https://*.myapp.com` for subdomains).
- Local dev: `http://localhost:5173` for that port only, or `http://localhost:*` for any port.
- Capacitor Android: `https://localhost`. Capacitor iOS: `capacitor://localhost`.
- Browser extension: `chrome-extension://<id>` (also `moz-extension://`, `safari-web-extension://`).

Some origins are configured platform-wide by the administrator (**global origins**) and apply to
every restricted key without appearing in `GET .../origins` — so a key may accept an origin you
never added to it. Read them with `GET /global-origins`, and test candidates against them with
`POST /global-origins/check` (step 4) rather than comparing strings: a `*.` rule covers its subdomains
**and** its apex, while an apex rule covers neither.

`http://` is accepted only for local hosts; a public host must be `https://`. A duplicate returns
`409`, so adding the same origin twice is safe to attempt. Full policy:
[API key restrictions](../getting-started/api-key-restrictions.md).

## Verify

Remember a key's own list will **not** show the global origins it also accepts — that is expected, not
a missing entry. After changes, `lookup` again (or `GET .../origins`) and confirm `restricted` is `true` with the
origins you expect. Then the frontend key is safe to ship: it only works from your own app.
