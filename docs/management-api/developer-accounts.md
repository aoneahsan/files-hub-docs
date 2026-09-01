---
sidebar_position: 7
title: Developer accounts
description: Store the tokens that publish under your name — npm, Hugging Face, Docker Hub, PyPI, crates.io, the extension stores, Vercel, Netlify, Sentry — on one account-level record, and read them back over the FilesHub Management API with a ready-to-write .npmrc line.
keywords: [npm token storage, store npm publish token, huggingface token api, docker hub pat storage, pypi token vault, ci publishing credentials, npmrc from api, can_read_developer_accounts, package publishing secrets, store marketplace credentials, developer account vault]
last_update:
  date: 2026-09-01
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

Twenty-one providers ship declared. `GET /developer-accounts/providers` returns the live list — call that
rather than trusting this paragraph, because adding a provider is a config entry and does not need a release
note.

| Group | Providers |
|---|---|
| Package registries | `npm`, `pypi`, `crates_io`, `rubygems`, `packagist`, `nuget`, `maven_central`, `homebrew_tap` |
| Developer platforms | `huggingface`, `github`, `docker_hub` |
| Extension & plugin stores | `chrome_web_store`, `vscode_marketplace`, `firefox_addons`, `edge_addons`, `jetbrains_marketplace` |
| Hosting & infrastructure | `cloudflare`, `vercel`, `netlify`, `expo`, `sentry` |

Each provider declares its own fields, because providers disagree about what a credential *is*: npm takes a
token, Docker Hub a username **and** a token, Maven Central a Sonatype token pair **and** a GPG passphrase.

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

## Where this is *not* the answer

- **Play Console and App Store Connect** are deliberately absent. Their signing material is genuinely
  per-app and lives in the [project vault](./project-vault.md); an upload needs an artefact you sign
  yourself, so there is no unattended publish for a stored credential to serve.
- **Six provider names also exist as project-vault services** — `github`, `cloudflare`, `sentry`,
  `chrome_web_store`, `firefox_addons`, `edge_addons`. They are not duplicates. The vault row is *that
  project's* configuration: a Sentry DSN, an extension id, a repo name. The developer account is the
  account-wide credential that can administer every one of them. A DSN is safe in a bundle; an auth token can
  delete a project.
