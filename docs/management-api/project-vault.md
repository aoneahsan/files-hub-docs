---
sidebar_position: 6
title: Project vault
description: Store every third-party credential, config file and identifier a project needs — Firebase, Google Cloud, Sentry, OneSignal, Cloudflare, signing keys and more — and read them back over the FilesHub Management API with a scoped token, including ready-to-paste .env blocks.
keywords: [project credential vault, store api keys per project, firebase config api, google services json api, android keystore storage, env file generator api, can_read_vault, can_reveal_vault, secrets vault for developers, bootstrap project credentials cli]
last_update:
  date: 2026-07-31
  author: Ahsan Mahmood
---

# Project vault

Starting or resuming a project normally means hunting across five consoles and two machines: Firebase
config in a `.env`, OAuth client ids in Google Cloud, a Sentry DSN in a dashboard, `google-services.json`
on one laptop, an OneSignal REST key in a password store.

The **project vault** ends that. Enter everything once in the FilesHub admin — the form tells you where in
each console to find every value — and this part of the Management API reads it back on demand, including
ready-to-paste `.env` blocks for Vite, Next, Node and Laravel.

These endpoints are **read + reveal only**. Entering credentials stays in the admin by design: a vault is
filled by a person and read by a machine, and there is exactly one place a value can be typed.

Base URL `https://fileshub.zaions.com/api/public/v1`, same `Authorization: Bearer fh_pat_...` as the rest
of the [Management API](./overview.md).

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

`supabase` (linked — see below) · `firebase` · `google_cloud` · `sentry` · `onesignal` · `clarity` ·
`amplitude` · `openai` · `smtp` · `cloudflare` · `capacitor` · `github` · `play_console` · `app_store` ·
`chrome_web_store` · `fileshub` · `native_update` · **`general`** (freeform — your own key/value pairs).

:::tip `client_safe` is not decoration
It decides whether a value appears in the generated `VITE_` / `NEXT_PUBLIC_` blocks. A field marked
`secret` is always `client_safe: false`, so a server secret **cannot** reach a browser bundle by mistake.
:::

## `GET /vault/projects`

Projects your token can see, each with vault metadata and which services are configured. Query: `q`
(matches name / slug / app identifier), `status`, `per_page` (default 20, max 50), `page`. Paginated
`{ "data": [...], "meta": {...}, "message": "..." }`.

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

# 2. Learn what this project holds, without reading a single secret
curl -s $BASE/projects/acme-app/vault -H "Authorization: Bearer $FH_PAT" | jq '.data.configured_services'

# 3. Write the client env file
curl -s -X POST $BASE/projects/acme-app/vault/reveal -H "Authorization: Bearer $FH_PAT" \
  | jq -r '.data.env.vite' > .env.local

# 4. Fetch the Android config file to where it belongs
curl -s $BASE/projects/acme-app/vault-files/firebase.google_services_json \
  -H "Authorization: Bearer $FH_PAT" -o android/app/google-services.json
```

:::danger Server and CLI only
An `fh_pat_` token is an account-wide secret and this plane sends **no CORS headers** — it is not callable
from a browser, by design. Never commit one, never ship one in an app.
:::
