---
sidebar_position: 6
title: Project vault
description: Store every third-party credential, config file and identifier a project needs — Firebase, Google Cloud, Sentry, OneSignal, Cloudflare, store consoles, signing keys and more — and read, reveal AND write them over the FilesHub Management API with a scoped token, including ready-to-paste .env blocks.
keywords: [project credential vault, store api keys per project, write credentials via api, firebase config api, google services json api, android keystore storage, env file generator api, can_read_vault, can_reveal_vault, can_write_vault, secrets vault for developers, bootstrap project credentials cli, seed project secrets programmatically]
last_update:
  date: 2026-08-21
  author: Ahsan Mahmood
---

# Project vault

Starting or resuming a project normally means hunting across five consoles and two machines: Firebase
config in a `.env`, OAuth client ids in Google Cloud, a Sentry DSN in a dashboard, `google-services.json`
on one laptop, an OneSignal REST key in a password store.

The **project vault** ends that. Enter everything once in the FilesHub admin — the form tells you where in
each console to find every value — and this part of the Management API reads it back on demand, including
ready-to-paste `.env` blocks for Vite, Next, Node and Laravel.

Since **`2026.08.20.1`** these endpoints **read, reveal and write**. Writing used to be admin-only, and that
was a deliberate decision, reaffirmed as recently as 2026-08-19 — so if you find a page, a skill or a note
still saying *"no credential write endpoint exists or is planned"*, it is stale. What changed is scale, not
principle: around sixty projects times ninety-odd declared fields is not a workload a form can carry, and
most of those values already exist in a local checkout, a git remote, or a console a CLI can read.

The admin keeps its per-field help text and stays the better place to type a single value by hand. This API
is for filling a project in from what a machine already knows. See
[Writing to the vault](#writing-to-the-vault).

Project *metadata* remains writable through `POST`/`PATCH /projects/{project}` — including
`supabase_project_id`, which is worth writing back the first time you resolve which Supabase project an app
belongs to.

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
- A project's real credentials may still live in the owner's own secret store until the vault is filled.
- 🔴 **Filling it is no longer owner-only.** Since `2026.08.20.1` a token holding `can_write_vault` can seed
  a project from whatever you can already read — a checkout, a git remote, a console CLI. That is the
  intended way to close the gap; see [Writing to the vault](#writing-to-the-vault).

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

## Three scopes, all off by default

The vault is gated by **three** booleans on the access token, because they authorise genuinely different
things:

| Scope | Grants |
|---|---|
| **`can_read_vault`** | Project metadata, links, and **which** credentials exist — presence flags only, never a value. Enough for a CI job to confirm a project is configured without handing it a single secret. |
| **`can_reveal_vault`** | The credential **values**, the config-file bytes, and the generated `.env` blocks. The most powerful *read* grant in the product. |
| **`can_write_vault`** | Creating, changing and deleting credentials, config files and project links. |

Reveal and write both **imply read** — a caller that may see or change the values would otherwise be refused
the cheaper metadata call, which reads as a bug. Write deliberately does **not** imply reveal: a seeding
agent should be able to fill a project in without being handed back every secret you already hold. Enable them per token in the admin → **Access Tokens**. A token without the scope
gets **`403 TOKEN_PERMISSION_DENIED`** — not the anti-enumeration `404` — because a scope is a property of
your own token, so there is nothing to enumerate and an honest error is more useful:

```json
{ "error": { "code": "TOKEN_PERMISSION_DENIED",
  "message": "This access token cannot reveal vault credentials. Enable \"Can Reveal Vault\" on it in the dashboard.",
  "details": { "required_scope": "can_reveal_vault" } } }
```

An out-of-scope or unknown **project** is still `404 NOT_FOUND`, as everywhere on this plane.

`GET /token` reports all three, so check before calling:

```json
{ "data": { "name": "...", "all_projects": true,
            "can_read_vault": true, "can_reveal_vault": false, "can_write_vault": false } }
```

:::caution `can_write_vault` is off on every existing token
The migration that added it defaults it to `false`, so no token gained anything when it ran. Until it is
enabled in the admin, every write answers `403` with `details.required_scope: "can_write_vault"`.
:::

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

**22 services, 101 fields** as of 2026-08-24:

`supabase` (linked — see below) · `firebase` · `google_cloud` · `sentry` · `onesignal` · `clarity` ·
`amplitude` · `ai` (linked — see below) · `openai` (superseded by `ai`) · `smtp` · `cloudflare` ·
**`turnstile`** · `capacitor` · `github` · `play_console` · `app_store` ·
`chrome_web_store` · `firefox_addons` · `edge_addons` · `fileshub` (derived — see below) · `native_update` ·
**`general`** (freeform — your own key/value pairs).

:red_circle: **`turnstile` is separate from `cloudflare` on purpose.** A project uses Cloudflare Turnstile
without owning any Cloudflare account configuration — no API token, no zone, no R2 — so merging them would
make `configured_services` report a Cloudflare account that does not exist. Its `secret_key` also powers
[`POST /api/v1/turnstile/verify`](../api/turnstile), which is the one vault credential FilesHub spends on
your behalf.

Read the count from the response rather than from this page — a service is added by editing config, so the
registry grows without an API change. `supabase` and `general` report **zero fields**: the first links
elsewhere, the second lets you name your own keys.

Each service also reports two booleans that matter before you try to write to it:

| Key | Means |
|---|---|
| `writable` | Whether `PUT /projects/{project}/vault/{service}` accepts fields for it |
| `derived` | The block is **computed** by FilesHub from records it already holds, not stored. Read-only |

`supabase` and `ai` are `writable: false` because they link elsewhere; `fileshub` is `writable: false`
because it is `derived: true`. Everything else is writable.

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

## Writing to the vault

Seven routes, all behind **`can_write_vault`**. Every one of them answers with the **same payload
`GET /projects/{project}/vault` returns** — so you confirm what actually landed without a second call, and
without needing `can_reveal_vault` — plus a `changes` block naming what moved:

```json
{ "data": { "...the full detail payload...":  "...",
            "changes": { "created": ["sentry.dsn"], "updated": [], "deleted": ["sentry.org_slug"] } } }
```

### `PUT /projects/{project}/vault/{service}` — upsert one service

Partial, and the two ways of "not sending a value" mean different things:

- an **absent** key leaves that field exactly as it was;
- an explicit **`null`** deletes that field's row.

```bash
curl -X PUT https://fileshub.zaions.com/api/public/v1/projects/my-app/vault/sentry \
  -H "Authorization: Bearer $FH_PAT" -H 'Content-Type: application/json' \
  -d '{"values": {"dsn": "https://abc@o1.ingest.sentry.io/2", "org_slug": "zaions", "auth_token": null}}'
```

For the freeform `general` service you name your own keys, and you may pass a `secrets` map alongside:

```json
{ "values":  { "algolia_app_id": "PUBLIC123", "algolia_admin_key": "..." },
  "secrets": { "algolia_app_id": false } }
```

:::danger `secrets` is honoured on freeform rows ONLY
For a field the registry declares, **the registry decides** whether it is secret and a caller-supplied flag
is ignored. That is not a courtesy — the non-reveal views filter on exactly that flag, so a caller able to
mark `sentry.auth_token` as public would publish a live credential in an ordinary `200` that needs no reveal
scope at all. On a freeform row the flag is the only signal there is, so its **absence defaults to `true`**.
:::

### `POST /projects/{project}/vault` — bulk, atomic

The call a seeding run actually uses: many services, and optionally the whole link list, in one transaction.
If any part is invalid, **nothing** is written.

```json
{ "services": { "firebase": { "project_id": "my-app", "web_api_key": "AIza..." },
                "github":   { "owner": "aoneahsan", "repo": "my-app" } },
  "links":    [ { "type": "repo", "url": "https://github.com/aoneahsan/my-app" } ] }
```

`links` is a **full replace** when present and untouched when absent — a link has no stable id you could
address, so `[]` means you deliberately cleared the list.

### `DELETE /projects/{project}/vault/{service}` — clear a service

Requires `{"confirm": true}`. It is the only call here that destroys credentials without naming them one by
one, so the shape stops you if you meant to clear a single field (`{"values": {"api_key": null}}`).

### `POST /projects/{project}/vault-move` — retire an orphan

Moves every row from one service onto another, renaming keys as it goes. `from` may be a service the
registry has never heard of — that is the whole point; `to` may not, or you would just relocate the orphan.

```json
{ "from": "google cloud firebase",
  "to":   "google_cloud",
  "keys": { "my-app-client-id": "oauth_web_client_id",
            "my-app-client-secret": "oauth_web_client_secret" } }
```

The move is validated **whole before anything is written**: if any destination key is undeclared the call
answers `422` and nothing moves. A half-moved credential set is worse than a refused one, because the next
reader sees two partial services and cannot tell which is authoritative. A key with no mapping is carried
over unchanged and validated like any other, so a partial `keys` map fails loudly instead of quietly
leaving rows behind.

### `POST | DELETE /projects/{project}/vault-files/{service}.{key}`

Two input forms, because the two callers differ. Multipart is what `curl` and a human reach for:

```bash
curl -X POST .../projects/my-app/vault-files/firebase.google_services_json \
  -H "Authorization: Bearer $FH_PAT" -F file=@google-services.json
```

JSON is what an agent already holding the bytes reaches for, with no temp file:

```json
{ "filename": "google-services.json", "content_base64": "eyJwcm9qZWN0X2luZm8iOnsuLi59fQ==" }
```

The size cap applies to the **decoded** bytes in both cases, and base64 is decoded strictly — a truncated or
corrupted payload is refused rather than stored as *something* that fails at signing time months later.

### `PUT /projects/{project}/links`

Replaces the link list. `type` must be one of the known kinds (`website`, `web_app`, `repo`, `docs`,
`play_store`, `app_store`, `chrome_web_store`, `npm`, `api`, `admin`, `other`).

### What the write plane refuses

Each of these exists because of something that already went wrong:

| Refused | Why |
|---|---|
| A **free-text service name** on create — `422 UNKNOWN_VAULT_SERVICE` | This is the entry-side half of the ISSUE-09 story above. An **existing** orphan stays deletable and movable: the write side must be able to clean up whatever the read side can see |
| An **undeclared field** on a declared service — `422 UNKNOWN_VAULT_FIELD` | Name your own keys on `general` instead |
| A **file field** on the value endpoint (`422 VAULT_FIELD_IS_A_FILE`), or a value field on the file endpoint (`422 VAULT_FIELD_IS_NOT_A_FILE`) | Both are keyed `(service, key)` in different tables, so the wrong one silently shadows the right one |
| Any write to a **linked** or **derived** service — `422 VAULT_SERVICE_NOT_WRITABLE` with `details.reason` | `GET /vault/services` publishes `writable` and `derived`, so you can know before you try |

Every write is recorded in the project's audit log with **field names only** — never a value. An audit trail
that logged credentials would be a second copy of the vault with none of its protections.

## `fileshub` is derived, not stored

The `fileshub` service describes this platform *as consumed by* your project — its FilesHub project slug,
API base, `fh_live_` key and that key's allowed origins. Since `2026.08.20.1` those four values are
**computed** from records FilesHub already holds, and writes to the service are refused:

```json
{ "error": { "code": "VAULT_SERVICE_NOT_WRITABLE", "details": { "reason": "derived" } } }
```

The reasoning is the same one that makes `supabase` a link rather than a copy: storing a second version of a
credential the database already owns gives you two values that can drift, with nothing to say which is
right. To change what this block reports, change the underlying records —
[`POST /projects/{project}/api-keys`](./endpoints.md) and the origins endpoints.

The block carries `derived: true` and, if a project somehow holds stored rows under `fileshub` from before
this change, names them in `shadowed_stored_fields[]` rather than quietly overriding them.

## AI provider accounts are linked, not copied

The `ai` tab holds no fields of its own. An OpenAI or Anthropic key authorises an **account** — it spends
that account's balance and reaches every model on it — and two or three accounts serve a whole fleet of
projects. Copied into each project's vault that would be one secret in twenty rows, rotated in twenty places
and agreeing in none, which is the duplication this vault exists to end. So it lives on its own record and
projects point at it.

🔴 **Many accounts per project, unlike the single Supabase link.** An app has one database, but routinely
uses an OpenAI account for embeddings *and* an Anthropic one for chat. The project payload carries an array:

```json
{ "ai_accounts": [
  { "id": 3, "provider": "anthropic", "display_name": "Anthropic — ai@example.com",
    "purpose": "chat", "has_key": true, "via": "explicit", "all_projects": false,
    "credentials_via": "/api/public/v1/ai-accounts/3/reveal",
    "note": "The key lives on the account-wide AI vault and needs the can_read_ai_accounts scope." } ] }
```

### The scope split is the whole point

| Call | Scope |
|---|---|
| `GET \| POST /ai-accounts`, `GET \| PATCH /ai-accounts/{account}`, `POST /ai-accounts/{account}/reveal` | **`can_read_ai_accounts`** for the reads and the reveal; `can_write_vault` to create or edit |
| `GET \| PUT /projects/{project}/ai-accounts` — which accounts a project may use | **`can_write_vault`** |
| `GET \| PUT /ai-accounts/{account}/projects` — which projects may use one account | **`can_write_vault`** |

:::danger `can_reveal_vault` does NOT grant an AI key
It is the most powerful grant over *project* credentials and it still answers `403` from every
`/ai-accounts` endpoint. The two authorise different things: `can_reveal_vault` is given to a caller that
should read one project's configuration, while an AI key is account-wide, spends a real balance, and is
bounded by nothing this platform knows about.

**Assigning** an account is different again and needs only `can_write_vault` — an assignment is a pointer
and those responses never contain a key.
:::

`{account}` resolves by numeric id, by account email, or by `provider:email`. The unique key is the **pair**,
because one mailbox routinely holds an OpenAI account and an Anthropic one.

### Revealing a key

```bash
curl -X POST https://fileshub.zaions.com/api/public/v1/ai-accounts/3/reveal \
  -H "Authorization: Bearer $FH_PAT"
```

Returns the key plus an `env.node` block carrying the variable the provider's SDK actually reads —
`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` and so on. Guessing `ANTHROPIC_KEY` fails at runtime
rather than at configuration time, which is why the block exists.

🔴 **There is no `vite` or `next` block here, and there never will be.** An AI provider key in a browser
bundle is someone else spending the account's balance. The project vault can offer client blocks because its
registry marks individual fields client-safe; nothing on this record is.

Every reveal is recorded with field **names** only and stamps `last_revealed_at`.

### Clearing a key

🔴 **Send `{"clear_api_key": true}` — a blank `api_key` will not do it.** A blank value is deliberately
dropped so that editing an unrelated field cannot wipe the credential, and it *cannot* be expressed as
"absent keeps, null clears" the way the vault endpoints are: Laravel's `ConvertEmptyStringsToNull` middleware
rewrites `""` to null before the controller sees it, so the two are indistinguishable and that rule would
destroy the key on any empty string.

### One account for every project

The common case is not "assign this key to a project" — it is *this key **is** the fleet's key*. Two ways to
say that, and they are **not the same thing**:

| You want | Do this | Covers a project created tomorrow? |
|---|---|---|
| Every project, forever | `PATCH /ai-accounts/{account}` with `{"all_projects": true}` | **yes** |
| Every project that exists right now | `PUT /ai-accounts/{account}/projects` with `{"all_existing": true}` | **no** |
| Exactly these projects | `PUT /ai-accounts/{account}/projects` with `{"project_ids": [12, 19]}` | no |

```bash
# the fleet key — one standing rule, no pivot rows to maintain
curl -X PATCH https://fileshub.zaions.com/api/public/v1/ai-accounts/1 \
  -H "Authorization: Bearer $FH_PAT" -H 'Content-Type: application/json' \
  -d '{"all_projects": true}'
```

Writing any of them needs **`can_write_vault`**, not `can_read_ai_accounts` — an assignment is a pointer and
none of these responses contains a key.

:::caution Sending both is a 422, on purpose
`{"all_existing": true}` together with `{"project_ids": […]}` is refused rather than resolved by precedence.
"all_existing wins" and "the explicit list wins" are equally defensible readings, which is exactly why you
should not have to guess which one this implementation chose.
:::

`GET /ai-accounts/{account}/projects` answers with the resolved set, and each entry reports **how** it is
reached — `via: "explicit"` for a pivot row somebody wrote, `via: "all_projects"` for the standing rule. That
distinction is what tells you where to go to undo it: an `all_projects` entry is not detachable from the
project, only from the account.

:::note `all_projects` here is not `all_projects` on your token
An access token also has an `all_projects` field, and it means the opposite direction: which projects *you*
may reach. An account flagged for every project never widens a token's scope — a project-scoped token asking
`GET /ai-accounts/{account}/projects` still sees only its own projects.
:::

### `openai` is superseded, and deliberately still there

The `openai` vault service still exists and still works. The `2026.08.21.1` data migration lifted stored
`openai` credentials onto account records **additively** — the original rows were left in place, because
deleting a credential is the owner's decision and not a migration's. Removing the service would have turned
every one of those rows into an orphan, which is precisely the failure documented at the top of this page.

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
