---
sidebar_position: 6
title: Project vault
description: Store every third-party credential, config file and identifier a project needs — Firebase, Google Cloud, Sentry, OneSignal, Cloudflare, signing keys and more — and read them back over the FilesHub Management API with a scoped token, including ready-to-paste .env blocks.
keywords: [project credential vault, store api keys per project, firebase config api, google services json api, android keystore storage, env file generator api, can_read_vault, can_reveal_vault, secrets vault for developers, bootstrap project credentials cli]
last_update:
  date: 2026-08-19
  author: Ahsan Mahmood
---

# Project vault

Starting or resuming a project normally means hunting across five consoles and two machines: Firebase
config in a `.env`, OAuth client ids in Google Cloud, a Sentry DSN in a dashboard, `google-services.json`
on one laptop, an OneSignal REST key in a password store.

The **project vault** ends that. Enter everything once in the FilesHub admin — the form tells you where in
each console to find every value — and this part of the Management API reads it back on demand, including
ready-to-paste `.env` blocks for Vite, Next, Node and Laravel.

These endpoints are **read + reveal only**, and that is a decision rather than a missing feature — it was
put to the owner again on 2026-08-19 and kept. Entering credentials stays in the admin: a vault is filled by
a person and read by a machine, there is exactly one place a value can be typed, and the form is where the
per-field help lives that says which console page each value comes from. **No credential write endpoint
exists or is planned.** An agent that discovers a credential records a task for the owner; it does not store
it, and it should not file the absence as a bug.

Project *metadata* is a different matter and **is** writable through `POST`/`PATCH /projects/{project}` —
including `supabase_project_id`, which is worth writing back the first time you resolve which Supabase
project an app belongs to.

Base URL `https://fileshub.zaions.com/api/public/v1`, same `Authorization: Bearer fh_pat_...` as the rest
of the [Management API](./overview.md).

:::danger The vault is live but very nearly EMPTY — and an empty answer is not an answer about the project

Probed on **2026-08-19**, with the ISSUE-09 read-path fix live: **7 of 54 registered projects hold a
credential.** The endpoints work exactly as documented below; for the other 47 the data has not been entered
yet, and those reveals return the full 18-service skeleton with every `has` flag `false`, `env: {}` and
`undecryptable: []`.

🔴 **The `1 of 54` figure this page carried a day earlier was wrong, and the reason is worth keeping.** It
was measured *through the broken reader* — so it could not see the very rows the bug was hiding. Six more
projects appeared the moment the fix went live. A live probe beats a stale document, but a live probe
through a broken instrument proves nothing: **re-measure after you fix the reader.**

**An empty service means the value has NOT BEEN ENTERED. It never means the project does not use that
service** — the response is byte-identical either way, so the two are indistinguishable from the API.
Reading "no Firebase config in the vault" as "this project has no Firebase" is a fabrication built from a
`false`.

So, concretely:

- Read presence from `has.*`, and treat every absence as **unknown**, not as absent.
- Do not write an empty `.env` from an empty reveal. `jq -r '.data.env.vite'` on an unconfigured project
  emits nothing and `> .env.local` truncates the file you already had — with no error anywhere.
- A project's real credentials still live in the owner's own secret store until the vault is filled.
- Filling it is **owner-only work in the admin**; credential writes never go through this API. A project
  whose credentials are missing is a row in that project's `docs/MANUAL-TASKS.md`, not something to work
  around quietly.

Report what the vault returned, not what it was expected to contain.
:::

:::warning Before `2026.08.19.1`, "empty" could also mean "stored, and unreportable"

This is worth stating plainly because it produced a confident wrong answer for two weeks.

Until that release every read path iterated the **registry** — the 18 declared services and their 87
declared fields — rather than the rows a project actually holds. A credential entered under a `service`
string outside those 18 (the admin's standalone credential form took free text, so a label typed where a key
belongs — `Google Cloud` for `google_cloud` — was accepted and stored) was therefore absent from `has`,
from `configured_services`, from `values` **and from `reveal`**. Three clean `200`s over live, encrypted,
correctly-stored credentials, with no error, no warning and nothing to notice.

**Fixed at both ends in `2026.08.19.1`:**

| Change | Effect |
|---|---|
| Presence is declared fields **∪ every row actually stored** | a credential under an undeclared key now appears in `has` |
| Each service block carries **`registered: true \| false`** | a service the registry never declared still gets a block, marked as such |
| **Every** payload carries **`unregistered_services[]`** | orphans are named at the top level of the project detail *and* of every `GET /vault/projects` list row, not left to be inferred |
| An unregistered service a project holds is addressable | `GET \| POST /projects/{project}/vault/{service}` resolves it; one the project does not hold is still `404` |
| The admin's `Service` field is a validated picker | a new orphan cannot be created, and opening an existing one cannot silently rewrite it |

Values stay fail-closed throughout: an **undeclared** field has no registry entry marking it safe, so it is
treated as secret, withheld from every non-reveal view, and never enters an `env` block.

**If you are reading a vault on an older deploy, state which marker you probed** (`GET /api/version`)
before reporting a project as empty.
:::

:::info Empty `has` / `values` maps encode as `{}`

They encoded as `[]` before `2026.08.19.1` — which is what an empty PHP array serialises to, and it appeared
exactly when a project had nothing stored, i.e. the common case. A typed client reading `has.project_id`
broke on it.
:::

## Two scopes, both off by default

The vault is gated by **two** booleans on the access token, because they authorise genuinely different
things:

| Scope | Grants |
|---|---|
| **`can_read_vault`** | Project metadata, links, and **which** credentials exist — presence flags only, never a value. Enough for a CI job to confirm a project is configured without handing it a single secret. |
| **`can_reveal_vault`** | The credential **values**, the config-file bytes, and the generated `.env` blocks. The most powerful grant in the product. |

Reveal implies read. Enable them per token in the admin → **Access Tokens**. A token without the scope
gets **`403 TOKEN_PERMISSION_DENIED`** — not the anti-enumeration `404` — because a scope is a property of
your own token, so there is nothing to enumerate and an honest error is more useful:

```json
{ "error": { "code": "TOKEN_PERMISSION_DENIED",
  "message": "This access token cannot reveal vault credentials. Enable \"Can Reveal Vault\" on it in the dashboard.",
  "details": { "required_scope": "can_reveal_vault" } } }
```

An out-of-scope or unknown **project** is still `404 NOT_FOUND`, as everywhere on this plane.

`GET /token` reports both flags, so check before calling:

```json
{ "data": { "name": "...", "all_projects": true, "can_read_vault": true, "can_reveal_vault": false } }
```

## `GET /vault/services` — schema discovery

**Start here.** Returns the whole field registry: every service, every field, its label, where to find it,
whether it is secret, whether it may ship in a browser bundle, and its `.env` name. Identical for every
project, so it describes the *shape* of the vault and never its contents — any valid token may read it.

```bash
curl -s https://fileshub.zaions.com/api/public/v1/vault/services \
  -H "Authorization: Bearer $FH_PAT"
```

```json
{ "data": { "services": [
  { "service": "firebase", "label": "Firebase", "freeform": false, "linked": null,
    "console": "https://console.firebase.google.com",
    "summary": "Web SDK config, the platform config files, and the Admin SDK service account.",
    "fields": [
      { "key": "web_api_key", "label": "Web API Key",
        "help": "Console → Project settings → General → Web API Key. Client-public by design — it identifies the project, it does not authorise anything.",
        "type": "text", "secret": false, "client_safe": true, "env_key": "FIREBASE_API_KEY" },
      { "key": "service_account_json", "label": "Service Account JSON",
        "help": "Console → Project settings → Service accounts → Generate new private key. Contains a private key — server-side only, never in a bundle.",
        "type": "file", "secret": true, "client_safe": false, "env_key": null }
    ] }
] } }
```

### Services covered

**18 services, 87 fields** as of 2026-08-04:

`supabase` (linked — see below) · `firebase` · `google_cloud` · `sentry` · `onesignal` · `clarity` ·
`amplitude` · `openai` · `smtp` · `cloudflare` · `capacitor` · `github` · `play_console` · `app_store` ·
`chrome_web_store` · `fileshub` · `native_update` · **`general`** (freeform — your own key/value pairs).

Read the count from the response rather than from this page — a service is added by editing config, so the
registry grows without an API change. `supabase` and `general` report **zero fields**: the first links
elsewhere, the second lets you name your own keys.

:::tip `client_safe` is not decoration
It decides whether a value appears in the generated `VITE_` / `NEXT_PUBLIC_` blocks. A field marked
`secret` is always `client_safe: false`, so a server secret **cannot** reach a browser bundle by mistake.
:::

## `GET /vault/projects`

Projects your token can see, each with vault metadata and which services are configured. Query: `q`
(matches name / slug / app identifier), `status`, `per_page` (default 20, max 50), `page`. Paginated
`{ "data": [...], "meta": {...}, "message": "..." }`.

:::warning Read `unregistered_services` on every row, not just `configured_services`
This is the endpoint a fleet-wide sweep reads, so it is the one where an orphan does the most damage.
Until **`2026.08.19.2`** a row reported an unregistered service inside `configured_services` with nothing
marking it as one — so a sweep concluded those projects were configured for a service that does not exist,
and the only way to tell was to diff every row against `GET /vault/services`.

Both fields now ship on each list row, from the same source as the detail payload, so the two cannot
disagree:

```json
{
  "slug": "acme-app",
  "configured_services": ["firebase", "google cloud firebase"],
  "unregistered_services": ["google cloud firebase"]
}
```

`"google cloud firebase"` there is a real example, not a hypothetical: on 2026-08-19, **six of the seven**
projects in this account that held any credential stored it under exactly that free-text string.
:::

## `GET /projects/{project}/vault`

One project **without any secret values**. `{project}` accepts the numeric id, the ULID `public_id`, or
the slug.

```json
{ "data": {
  "public_id": "01KYWC0CZX23Q6MGM94G8FZHAC",
  "name": "Acme App",
  "app_identifier": "com.acme.app",
  "primary_url": "https://acme.example.com",
  "repo": { "url": "https://github.com/acme/app", "is_public": false },
  "platforms": ["web", "android"],
  "configured_services": ["firebase", "google_cloud", "sentry"],
  "links": [ { "type": "repo", "type_label": "Git Repository", "url": "https://github.com/acme/app" } ],
  "supabase": null,
  "services": {
    "firebase": {
      "label": "Firebase",
      "has": { "web_api_key": true, "service_account_json": true, "measurement_id": false },
      "values": { "web_api_key": "AIza..." }
    },
    "google_cloud": {
      "label": "Google Cloud",
      "has": { "oauth_web_client_secret": true },
      "values": {}
    }
  },
  "files": [ { "service": "firebase", "key": "google_services_json",
               "filename": "google-services.json", "size_bytes": 2481,
               "checksum": "9f2c…", "mime_type": "application/json" } ]
} }
```

`has` tells you what a reveal **would** return; `values` carries only the non-secret ones. Note
`google_cloud.values` is empty while `has.oauth_web_client_secret` is `true` — that is the contract
working.

## `GET /projects/{project}/vault/{service}`

The same, narrowed to one service. An unknown service name returns `404` and lists the valid ones.

## `POST /projects/{project}/vault/reveal`

Everything, secrets included, plus the `.env` blocks. **Recorded** against the project.

```bash
curl -s -X POST \
  https://fileshub.zaions.com/api/public/v1/projects/acme-app/vault/reveal \
  -H "Authorization: Bearer $FH_PAT"
```

```json
{ "data": {
  "services": { "google_cloud": { "values": { "oauth_web_client_secret": "GOCSPX-..." } } },
  "env": {
    "vite":    "VITE_FIREBASE_API_KEY=AIza...\nVITE_SENTRY_DSN=https://...",
    "next":    "NEXT_PUBLIC_FIREBASE_API_KEY=AIza...",
    "node":    "FIREBASE_API_KEY=AIza...\nGOOGLE_CLIENT_SECRET=GOCSPX-...",
    "laravel": "FIREBASE_API_KEY=AIza...\nGOOGLE_CLIENT_SECRET=GOCSPX-..."
  },
  "files": [ { "service": "firebase", "key": "google_services_json",
               "download": "/api/public/v1/projects/01KY.../vault-files/firebase.google_services_json" } ],
  "undecryptable": []
} }
```

`POST /projects/{project}/vault/{service}/reveal` narrows it to one service.

### Every `env` block is optional

A block that would be empty is **dropped, not returned as `""`** — so the four keys above are what you get
when all four have content, and a project with nothing configured returns **`env: {}`**. Read the key
defensively (`.data.env.vite // empty`); piping an absent block into a file writes an empty file and reports
no error.

`vite` and `next` carry only fields the registry marks `client_safe`, and a `secret` field is forced
non-client-safe — which is what makes "a server secret never reaches a browser bundle" structural rather
than remembered. Use the block you are given; never hand-filter one.

### `undecryptable`

Names any field that **holds** a value which could not be decrypted — stored under a previous `APP_KEY`.
It is reported honestly rather than returned as an indistinguishable `null`, so you can tell *"not set"*
from *"set but unreadable"*. The remedy is to re-enter that value in the admin.

## `GET /projects/{project}/vault-files/{service}.{key}`

The real bytes of a stored config file, with its original filename and an `X-Checksum-Sha256` header.
Requires `can_reveal_vault`.

```bash
curl -s -OJ \
  "https://fileshub.zaions.com/api/public/v1/projects/acme-app/vault-files/firebase.google_services_json" \
  -H "Authorization: Bearer $FH_PAT"
```

A file that is stored but undecryptable returns `409 PLAINTEXT_UNAVAILABLE` with
`details.reason: "undecryptable"` — a different answer from missing, because the remedy differs.

## Supabase is linked, not copied

The `supabase` tab holds no fields of its own. A project points at a record in the account-wide
[Supabase vault](./supabase-projects.md), and the detail response carries a pointer:

```json
{ "supabase": { "ref": "abcdefgh", "url": "https://abcdefgh.supabase.co",
  "credentials_via": "/api/public/v1/supabase-projects/abcdefgh",
  "note": "Supabase credentials live in the account-wide vault and need the can_manage_supabase scope." } }
```

Two copies of one secret is the problem this vault exists to end, so those credentials stay behind their
own endpoints and their own scope.

## Every reveal is recorded

Each reveal — over this API **or** through the admin UI — writes a row holding who read it, from where,
and **which field names** were included. Never a value: an audit trail that contained credentials would
just be a second credential store. The trail is visible on the project's own page in the admin.

## Bootstrapping a machine — the whole point

```bash
FH_PAT="$(cat ~/.secrets/fileshub/management-access-token)"
BASE=https://fileshub.zaions.com/api/public/v1

# 1. Confirm the token has what you need
curl -s $BASE/token -H "Authorization: Bearer $FH_PAT" | jq '.data | {can_read_vault, can_reveal_vault}'

# 2. Learn what this project holds, without reading a single secret.
#    An empty list means nothing has been entered yet — stop here rather than
#    writing empty files over good ones.
curl -s $BASE/projects/acme-app/vault -H "Authorization: Bearer $FH_PAT" | jq '.data.configured_services'

# 3. Write the client env file — only if there is actually a block to write
block=$(curl -s -X POST $BASE/projects/acme-app/vault/reveal \
  -H "Authorization: Bearer $FH_PAT" | jq -r '.data.env.vite // empty')
[ -n "$block" ] && printf '%s\n' "$block" > .env.local || echo "no client env stored for this project"

# 4. Fetch the Android config file to where it belongs (404 if it was never uploaded)
curl -sf $BASE/projects/acme-app/vault-files/firebase.google_services_json \
  -H "Authorization: Bearer $FH_PAT" -o android/app/google-services.json \
  || echo "no google-services.json in the vault for this project"
```

Both guards matter for the same reason: an unconfigured vault answers `200` with nothing in it, so an
unguarded pipeline overwrites working local config with emptiness and exits successfully.

:::danger Server and CLI only
An `fh_pat_` token is an account-wide secret and this plane sends **no CORS headers** — it is not callable
from a browser, by design. Never commit one, never ship one in an app.
:::
