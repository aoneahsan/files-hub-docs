---
sidebar_position: 4
title: Password manager — access and scopes
sidebar_label: Access and scopes
description: How FilesHub decides which passwords an API key can reach — own and admin password scopes, every-project reach, the five abilities — and how to grant them in the dashboard or over the Management API with can_manage_passwords.
keywords: [fileshub password scope, own scope admin scope, api key abilities, can_manage_passwords, password_scope, password_all_projects, password_abilities]
last_update:
  date: 2026-10-23
  author: FilesHub team
---

# Access and scopes

Three settings on a data-plane API key decide everything a key can do in the password manager. All three
are **closed by default**: a new or existing key cannot touch a password until you change them.

| Key setting | Values | Default |
|---|---|---|
| `password_scope` | `none` · `own` · `admin` | `none` |
| `password_all_projects` | boolean — `admin` keys only | `false` |
| `password_abilities` | any of `list`, `reveal`, `create`, `update`, `delete`; `null` means all five | `null` |

## The scopes

### `own` — a private shelf per key

The key reaches **only the entries it created itself**, in its own project. Two own keys in the same project
never see each other's entries, and **an admin key never sees them either**. Use it when each integration (a
deploy bot, a scraper, a customer-facing service) should keep its own logins to itself.

If an own key is deleted, its entries stay. They are then visible only in the dashboard.

### `admin` — the team's shared logins

The key reaches entries created by **any admin key** or **in the dashboard**, in its own project. It never
reaches an `own` key's entries. Use it for the logins the team shares and also manages by hand in the
dashboard.

### `admin` + every project

With `password_all_projects` on, an admin key reaches the admin and dashboard entries of **every** project:

- `GET /passwords` lists across projects; add `project_id` to narrow to one;
- `POST /passwords` may send `project_id` to store an entry in another project.

Grant it to the one key that administers all your projects, not to an app key.

### What decides an entry's owner

| Created by | `owner_scope` | Reached by |
|---|---|---|
| an `own` key | `own` | that key only (and the dashboard) |
| an `admin` key | `admin` | admin keys of that project, every-project admin keys, the dashboard |
| the dashboard | `admin` | the same as above |

The owner never changes when an entry is edited.

## Abilities

Abilities narrow what a granted scope may do. They never widen reach.

| Ability | Allows |
|---|---|
| `list` | `GET /passwords`, `GET /passwords/{id}` — details, never the password |
| `reveal` | `POST /passwords/{id}/reveal` — the password, the current code, the history |
| `create` | `POST /passwords` (and `POST /passwords/generate`) |
| `update` | `PATCH /passwords/{id}` (and `POST /passwords/generate`) |
| `delete` | `DELETE /passwords/{id}` (and permanent removal), `POST /passwords/{id}/restore` |

Examples:

| Key | Scope | Abilities | Use |
|---|---|---|---|
| CI deploy bot | `admin` | `list`, `reveal` | Reads the shared registry login, can change nothing |
| Signup service | `own` | `create`, `list`, `reveal`, `update` | Stores the accounts it creates; cannot delete |
| Your admin script | `admin` + every project | all | Manages every project's shared logins |

## Granting in the dashboard

Nova → Projects & API → **API Keys** → the key → **Edit**:

- **Password Access:** None, Own or Admin;
- **Password Access: Every Project:** admin keys only;
- **Password Abilities:** tick what it may do (all ticked = everything).

## Granting over the Management API

`POST /api/public/v1/projects/{project}/api-keys` and `PATCH /api/public/v1/projects/{project}/api-keys/{apiKey}`
accept the three fields. The calling token needs **`can_manage_passwords`**; `password_all_projects: true`
also needs an **all-projects** token. Otherwise the call answers `422` and nothing is saved.

```bash
curl -X PATCH https://fileshub.zaions.com/api/public/v1/projects/my-project/api-keys/42 \
  -H "Authorization: Bearer $FILESHUB_PAT" -H "Content-Type: application/json" \
  -d '{"password_scope": "admin", "password_all_projects": false, "password_abilities": ["list", "reveal"]}'
```

Every key answer on the Management plane now includes the three fields:

```json
{ "data": { "id": 42, "name": "ci-bot", "password_scope": "admin", "password_all_projects": false, "password_abilities": ["list", "reveal"], "...": "…" } }
```

Errors you may see:

| `422` message | Fix |
|---|---|
| `Changing a key's password access requires can_manage_passwords on the management token.` | Use a token with `can_manage_passwords` (turn it on in Nova → Access Tokens, or ask an owner). |
| `An every-project password reach requires an all-projects management token.` | Use a token with **All Projects**. |
| `The selected password scope is invalid.` | `none`, `own` or `admin`. |

`can_manage_passwords` is a management-token scope of its own (see
[Authentication](../../management-api/authentication.md)); no other scope implies it. It appears in
`GET /api/public/v1/token`, and a token with `can_manage_access_tokens` can pass it on only if it holds it.
