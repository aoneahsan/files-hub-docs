---
sidebar_position: 7
title: Agent workflow — auto-configure a project's API key
description: Step-by-step recipe for an AI coding agent to map a local project to its FilesHub project and enforce origin restrictions on its API key using the Management API, checking global origins before adding duplicates.
keywords: [ai agent fileshub, claude code fileshub, automate api key setup, origin restriction automation, global origins check, fh_pat access token workflow, wire up api key from env]
last_update:
  date: 2026-08-19
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

## Bootstrapping a whole project from the vault

The workflow above wires up FilesHub itself. The **[project vault](./project-vault.md)** does the same for
everything *else* a project needs — Firebase config, OAuth client ids, a Sentry DSN, an OneSignal key,
`google-services.json`, signing fingerprints — so a fresh machine can be brought up without opening a
single console.

```bash
BASE=https://fileshub.zaions.com/api/public/v1

# What can this token do?
curl -s $BASE/token -H "Authorization: Bearer $FH_PAT" \
  | jq '.data | {can_read_vault, can_reveal_vault, can_write_vault}'

# What does the vault even hold? (schema, not contents — any valid token)
curl -s $BASE/vault/services -H "Authorization: Bearer $FH_PAT" \
  | jq -r '.data.services[] | "\(.service): \(.fields | length) fields"'

# Which services is THIS project configured for? (no secret leaves the vault)
# Read `unregistered_services` too — a value stored under a service the registry
# does not declare is real, readable, and named only there.
curl -s $BASE/projects/my-app/vault -H "Authorization: Bearer $FH_PAT" \
  | jq '.data | {configured_services, unregistered_services}'

# Write the env file and fetch the Android config
curl -s -X POST $BASE/projects/my-app/vault/reveal -H "Authorization: Bearer $FH_PAT" \
  | jq -r '.data.env.vite' > .env.local
curl -s $BASE/projects/my-app/vault-files/firebase.google_services_json \
  -H "Authorization: Bearer $FH_PAT" -o android/app/google-services.json
```

Four things worth knowing before you call it:

- 🔴 **Almost nothing is stored in it yet.** As of 2026-08-19 one registered project of 54 has a configured
  service, so nearly every reveal returns the empty skeleton with `env: {}`. The commands above will succeed
  and write **nothing** — `jq -r '.data.env.vite'` on an unconfigured project emits an empty string and `>`
  truncates whatever `.env.local` already held. Guard on the value (`// empty`) and use `curl -sf` for
  files. And read an empty service as *not entered yet*, never as *this project does not use that service*:
  the response is identical either way. See [Project vault](./project-vault.md).
- 🔴 **On a deploy older than `2026.08.19.1`, an empty answer could also mean *stored and unreportable*.**
  Every read path used to iterate the registry rather than the project's own rows, so a credential entered
  under a service name outside the declared 18 was absent from `has`, `configured_services`, `values` and
  `reveal` alike — clean `200`s over live credentials. Check `GET /api/version` before you report a vault as
  empty, and on a current deploy read `unregistered_services` and each service's `registered` flag.
- **The scopes are off by default.** `can_read_vault`, `can_reveal_vault` and `can_write_vault` are separate
  booleans on the token; without them you get `403 TOKEN_PERMISSION_DENIED` naming the one you need. Only the
  owner can enable them, in the admin — so treat a `403` as a question for them, not something to route
  around.
- 🔴 **The vault is writable since `2026.08.20.1`, and a missing credential is no longer only a task for the
  owner.** With `can_write_vault` you can seed a project from a checkout, a git remote or a console CLI —
  see [Writing to the vault](./project-vault.md#writing-to-the-vault). Note that write **implies read but
  not reveal**, so a seeding token need not be able to read back secrets it is not adding.
- **The `vite` and `next` env blocks contain only values marked `client_safe`.** A server secret is not
  omitted by luck — it is structurally unable to appear there, which is the point. Use the block you are
  given rather than filtering one yourself.

## Deploying to Supabase without an interactive login

`supabase link`, `supabase db push` and `supabase functions deploy` all read `SUPABASE_ACCESS_TOKEN`, and
the vault hands you exactly that line:

```bash
export SUPABASE_ACCESS_TOKEN=$(
  curl -s -X POST $BASE/supabase-accounts/you@example.com/reveal \
    -H "Authorization: Bearer $FH_PAT" | jq -r '.data.secrets.personal_access_token'
)
supabase link --project-ref <ref>
```

This needs **`can_read_supabase_tokens`**, which is its own switch — a token holding `can_manage_supabase`
gets `403` here. Since `2026.08.19.1` a project-scoped token additionally only reaches the accounts and
Supabase projects linked from a FilesHub project it can manage (plus unlinked ones); record the link with
`PATCH $BASE/projects/my-app -d '{"supabase_project_id": <id>}'` the first time you resolve it. That is deliberate: `can_manage_supabase` reads one project's credentials, while an
account token can create and delete every project the account owns. Check both before you script anything:

```bash
curl -s $BASE/token -H "Authorization: Bearer $FH_PAT" \
  | jq '.data | {can_manage_supabase, can_read_supabase_tokens}'
```

See [Supabase account tokens](./supabase-accounts.md).
