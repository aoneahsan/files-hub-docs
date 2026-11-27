---
sidebar_position: 7
title: Developer accounts
description: Store the tokens that publish under your name — npm, Hugging Face, Docker Hub, PyPI, crates.io, the extension stores, Vercel, Netlify, Sentry — on one account-level record, and read them back over the FilesHub Management API with a ready-to-write .npmrc line.
keywords: [sentry auth token for all projects, sentry organization token storage, npm token storage, store npm publish token, huggingface token api, docker hub pat storage, pypi token vault, ci publishing credentials, npmrc from api, can_read_developer_accounts, package publishing secrets, store marketplace credentials, developer account vault]
last_update:
  date: 2026-11-27
  author: Ahsan Mahmood
---

# Developer accounts

A publish token is not a project credential. One npm token publishes **every** package you own; one Hugging
Face write token reaches every model repo on the account. Copy that into each project's vault and you have
not stored one credential — you have stored fifty copies of it, and rotating means finding all fifty.

So it lives on its own record, and projects point at it. Same reasoning as the
[Supabase account tokens](./supabase-accounts.md) and the [AI provider accounts](./project-vault.md#ai-provider-accounts-are-linked-not-copied):
when a credential authorises an *account*, it belongs to the account.

Available since backend **`2026.09.01.1`**.

## What it holds

Twenty-two providers ship declared. `GET /developer-accounts/providers` returns the live list — call that
rather than trusting this paragraph, because adding a provider is a config entry and does not need a release
note.

| Group | Providers |
|---|---|
| Package registries | `npm`, `pypi`, `crates_io`, `rubygems`, `packagist`, `nuget`, `maven_central`, `homebrew_tap` |
| Developer platforms | `huggingface`, `github`, `docker_hub` |
| Extension & plugin stores | `chrome_web_store`, `vscode_marketplace`, `firefox_addons`, `edge_addons`, `jetbrains_marketplace` |
| Hosting & infrastructure | `cloudflare`, `vercel`, `netlify`, `expo`, `sentry` |
| Own products | `native_update` |

Each provider declares its own fields, because providers disagree about what a credential *is*: npm takes a
token, Docker Hub a username **and** a token, Maven Central a Sonatype token pair **and** a GPG passphrase.

### A provider name may also be a project-vault service

Six of these names — `github`, `cloudflare`, `sentry`, `native_update`, and the extension stores — also exist
as services in a [project's vault](./project-vault.md). They are not duplicates, and merging them loses the
distinction that matters:

- the **project vault** row is *that project's* configuration — a Sentry DSN, an extension id, a repo name,
  an OTA app id and its per-app device key. One row per project, and much of it is safe in a bundle.
- the **developer account** is the account-wide credential that can administer every one of them.

A DSN says where errors go; an auth token can delete the project. Storing them together is how the wrong one
gets sent.

**Sentry goes one step further** (backend `2026.11.27.1`): a project's vault does not hold a Sentry auth
token at all. It reads one from the Sentry developer account that serves it. See
[Sentry: one account, every project](#sentry-one-account-every-project).

### A field may declare a format, and both write planes enforce it

Since `2026.09.04.1`, a provider can declare the shape its own backend requires, and a value that does not
match is refused on write with **422 `INVALID_DEVELOPER_ACCOUNT_CREDENTIAL`**:

```json
{
  "error": {
    "code": "INVALID_DEVELOPER_ACCOUNT_CREDENTIAL",
    "message": "A native-update access token looks like nu_pat_ followed by 64 hex characters and a 4-character checksum. An app API key (nu_app_…) authenticates the device update plane and is rejected here on format.",
    "details": { "provider": "native_update", "field": "token" }
  }
}
```

`details` names the provider and the field and **never the value** — a validation error that echoes what was
sent puts a credential into the response body, your log and your CI transcript.

Two fields declare one today. `sentry.auth_token` must start with `sntrys_` (organization token) or
`sntryu_` (personal token), so a DSN or a legacy API key pasted into the wrong box is refused on entry.
`native_update.token` exists because that platform mints two token families whose
names differ by four characters, one of which is meant to ship inside an app; sending the wrong one fails on
*format* at your first publish, months later, with an error that reads like a revoked token.

## The scope

```
can_read_developer_accounts     list · show · reveal
can_write_vault                 create · edit · assign to projects
```

🔴 **Nothing else implies `can_read_developer_accounts`.** Not `can_reveal_vault`, which is granted so a
caller can read one project's configuration. Not `can_read_ai_accounts`, which is granted so a caller can
spend an AI balance. Neither is a reason to publish a package under your name — a publish is public,
permanent and irreversible, and no registry offers an undo.

It defaults to **off**, so a token that has never been edited gets:

```json
{ "error": { "code": "TOKEN_PERMISSION_DENIED",
             "message": "This access token cannot read developer accounts…",
             "details": { "required_scope": "can_read_developer_accounts" } } }
```

Turn it on in the admin under **Access Tokens**, then confirm with `GET /token`.

Assigning an account to a project needs only `can_write_vault`, because an assignment is a **pointer** — those
responses never contain a value.

## Endpoints

| Call | Scope | Notes |
|---|---|---|
| `GET /developer-accounts/providers` | any valid token | The registry: every provider, its fields, which are secret, the env var each maps to. Describes the schema, never a record |
| `GET /developer-accounts` | read | `?q=` · `?provider=` · `?active=`. Paginated, default 20, max 50 |
| `POST /developer-accounts` | write | `provider` is required and must be one the registry declares |
| `GET /developer-accounts/{account}` | read | `{account}` = numeric id, the identifier, or `provider:identifier` |
| `PATCH /developer-accounts/{account}` | write | Answers with the whole record **plus `changes`** (field names only) |
| `POST /developer-accounts/{account}/reveal` | read | The values, the env block, and the config files |
| `GET\|PUT /developer-accounts/{account}/projects` | read / write | One account → many projects |
| `GET\|PUT /projects/{project}/developer-accounts` | vault read / write | One project → many accounts |

## The reveal is the point

A reveal does not just hand back a string. It hands back the thing you were going to build from the string:

```bash
curl -X POST https://fileshub.zaions.com/api/public/v1/developer-accounts/npm:aoneahsan/reveal \
  -H "Authorization: Bearer fh_pat_..."
```

```json
{
  "data": {
    "provider": "npm",
    "has": { "token": true, "username": true, "registry": false },
    "complete": true,
    "credentials": { "token": "npm_…", "username": "aoneahsan" },
    "undecryptable": [],
    "env": { "node": "NPM_TOKEN=npm_…" },
    "config_files": { ".npmrc": "//registry.npmjs.org/:_authToken=npm_…" }
  }
}
```

**Write what you are given.** A job that re-derives `//registry.npmjs.org/:_authToken=` gets the prefix subtly
wrong once — a missing leading `//`, the wrong registry host — and then cannot publish, while the error
blames authentication. One line, in CI:

```bash
npm config set //registry.npmjs.org/:_authToken \
  "$(curl -s -X POST "$FH/developer-accounts/npm:aoneahsan/reveal" -H "Authorization: Bearer $FH_PAT" \
     | jq -r '.data.credentials.token')"
npm whoami   # the whole test: prints your username, or 401
```

🔴 **`env` has a `node` key and never a `vite` or `next` one.** Every field on a developer account
authenticates a publish, so there is no browser-safe value here for such a block to contain — unlike the
[project vault](./project-vault.md), which legitimately holds both kinds and has to filter. A
`VITE_`/`NEXT_PUBLIC_` variable is inlined into a bundle, and an npm publish token in a bundle is a public
npm publish token.

## Reading the response

- **`has`** — which credentials exist, without decrypting any of them. Use it to decide whether a reveal is
  worth making.
- **`complete`** — whether every field the provider marks *required* has a value. An incomplete account is
  storable on purpose: you should be able to save half a credential and come back to it.
- **`undecryptable`** — field names that hold a value which could not be decrypted (an app key was rotated).
  `has` stays `true` while the value is `null`, because *set but unreadable* and *not set* need different
  fixes. This is a list, so it is `[]` when empty.
- **`env` and `config_files`** are maps, so they are `{}` when empty — which is the normal state of a brand
  new account. (They were `[]` in `2026.09.01.1`; fixed in `2026.09.01.2`.)

## Serving every project

An account reaches a project two ways:

| Mechanism | Meaning |
|---|---|
| `PUT /developer-accounts/{account}/projects` with `{"project_ids": [...]}` | An explicit set. `[]` detaches everything |
| `PUT …/projects` with `{"all_existing": true}` | A **snapshot** of every project that exists right now. A project created tomorrow is not covered |
| `PATCH /developer-accounts/{account}` with `{"all_projects": true}` | A **standing rule** — every project, including future ones |

Sending `all_existing` and `project_ids` in one body is a **422**, not a resolved precedence: "the snapshot
wins" and "the explicit list wins" are equally defensible, so you should never have to guess which was built.

For one npm token that publishes the whole fleet, `all_projects` is almost always what you want. Each
resolved entry reports `via: explicit | all_projects`, which tells you where to undo it.

🔴 **A name collision worth knowing:** an access token *also* has an `all_projects` field, meaning which
projects **you** may reach. They are unrelated, and an account flagged for every project never widens a
token's scope — a project-scoped token still sees only its own projects listed under that account.

## Sentry: one account, every project

From backend **`2026.11.27.1`**, the Sentry auth token lives **only** on a `sentry` developer account. The
project vault's `sentry` service keeps the per-project facts (the DSN, the org and project slugs) and no
longer has an `auth_token` field. Each project gets the token from whichever Sentry account serves it.

The account holds the organisation's details in one place:

| Field | Secret | Env var | What it is |
|---|---|---|---|
| `auth_token` | yes · required | `SENTRY_AUTH_TOKEN` | Organization token (`sntrys_…`) or personal token (`sntryu_…`) |
| `token_type` · `token_scopes` | no | | Which kind of token, and what it may do (`project:releases`, `org:read`) |
| `org_slug` · `org_id` | no | `SENTRY_ORG` | The organisation |
| `api_base` | no | `SENTRY_URL` | `https://sentry.io`, `https://de.sentry.io`, or your self-hosted URL |
| `account_email` · `password` | password only | | The login |
| `two_factor_recovery_codes` | yes | | One per line |
| `integration_client_id` · `integration_client_secret` | secret only | | An internal integration. The secret also verifies its webhooks (`Sentry-Hook-Signature`) |
| `webhook_url` | no | | Where that integration sends webhooks |
| `legacy_api_key` | yes | | The old organisation API key, for tooling that still asks for one |

Set it up in three calls:

```bash
# 1. Create the account. The org slug is the identifier.
curl -X POST "$FH/developer-accounts" -H "Authorization: Bearer $FH_PAT" -H "Content-Type: application/json" \
  -d '{"provider": "sentry", "account_identifier": "zaions", "credentials": {"auth_token": "sntrys_…", "org_slug": "zaions"}}'

# 2a. Serve every project, including ones created later…
curl -X PATCH "$FH/developer-accounts/sentry:zaions" -H "Authorization: Bearer $FH_PAT" -H "Content-Type: application/json" \
  -d '{"all_projects": true}'

# 2b. …or only the ones you pick.
curl -X PUT "$FH/developer-accounts/sentry:zaions/projects" -H "Authorization: Bearer $FH_PAT" -H "Content-Type: application/json" \
  -d '{"project_ids": [12, 31]}'
```

Rotating the token is one `PATCH` with `{"credentials": {"auth_token": "sntrys_…"}}`, and every project it
serves picks up the new value on its next read.

### What a project sees

A project's vault reports the inherited field under `services.sentry`:

```json
{
  "has": { "dsn": true, "org_slug": true, "project_slug": true, "auth_token": true },
  "inherited": {
    "auth_token": {
      "developer_account_id": 7,
      "developer_account": "Sentry (organisation) — zaions",
      "via": "all_projects",
      "ambiguous": false,
      "candidates": 1,
      "required_scope": "can_read_developer_accounts",
      "reveal_via": "/api/public/v1/developer-accounts/7/reveal",
      "included": false
    }
  },
  "shadowed_stored_fields": []
}
```

🔴 **The value needs both scopes.** A [project vault reveal](./project-vault.md) with `can_reveal_vault`
alone tells you the token exists and which account holds it, and leaves the value out (`included: false`).
Add `can_read_developer_accounts` and the reveal carries `values.auth_token` plus a `SENTRY_AUTH_TOKEN` line
in the `node` and `laravel` env blocks. It is never added to `vite` or `next`. That read is also written to
the Sentry account's own reveal history.

**Which account wins.** One attached to the project explicitly beats one serving all projects; after that,
the lowest id. When more than one qualifies, `ambiguous` is `true` and `candidates` says how many, so two
organisations competing for one project are visible instead of silently resolved. Inactive accounts never
serve.

**Writing it on a project is refused.** `PUT /projects/{p}/vault/sentry` with a value for `auth_token`
answers **422 `INHERITED_VAULT_FIELD`**, naming the provider and the field to set instead. An explicit
`"auth_token": null` is still accepted, so a token stored on a project before this release can be deleted
over the API. Until it is deleted, such a row is listed in `shadowed_stored_fields` and is never served.

## Where this is *not* the answer

- **Play Console and App Store Connect** are deliberately absent. Their signing material is genuinely
  per-app and lives in the [project vault](./project-vault.md); an upload needs an artefact you sign
  yourself, so there is no unattended publish for a stored credential to serve.
- **Six provider names also exist as project-vault services** — `github`, `cloudflare`, `sentry`,
  `chrome_web_store`, `firefox_addons`, `edge_addons`. They are not duplicates. The vault row is *that
  project's* configuration: a Sentry DSN, an extension id, a repo name. The developer account is the
  account-wide credential that can administer every one of them. A DSN is safe in a bundle; an auth token can
  delete a project. For Sentry the token is not stored on a project at all; it is
  [inherited from the account](#sentry-one-account-every-project).
