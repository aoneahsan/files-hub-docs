---
sidebar_position: 20
title: Password manager
description: Store logins in FilesHub and manage them over the API — websites, usernames, encrypted passwords, verification codes, notes and tags — with own and admin key scopes that decide which passwords a key can reach.
keywords: [fileshub password manager, password api, store passwords api, totp api, /api/v1/passwords, api key scopes]
last_update:
  date: 2026-10-23
  author: FilesHub team
---

# Password manager

Since backend `2026.10.23.5`, a FilesHub project can keep logins in the shape of iCloud Passwords: a title,
one or more websites, a username, the password, an optional verification-code setup key (the app then hands
you the current 6-digit code), notes, tags and a favourite flag. Passwords, setup keys, notes and earlier
passwords are encrypted at rest. Deleting moves an entry to **Recently Deleted**, where it can be restored or
removed for good.

## Who can reach which password

The manager is **off for every API key** until a key is given a password scope (in the dashboard, or over the
Management API by a token with `can_manage_passwords`).

| Key scope | Reaches |
|---|---|
| `none` (default) | Nothing: every password route answers 403. |
| `own` | Only the passwords **this key** created, in its project. |
| `admin` | Passwords created by admin keys or in the dashboard, in the key's project. Never an `own` key's passwords. |
| `admin` + every project (`password_all_projects`) | The same, in **every** project. Needs an all-projects management token to grant. |

**Abilities** narrow a scope: `list`, `reveal`, `create`, `update`, `delete`. A key with no list set has all
five. A password outside a key's reach answers **404**, never 403, so a key cannot learn that it exists.

Your own (internal) projects use the manager freely. An external project has no plan for it yet, so it
answers **402**.

## Endpoints

All on the data plane: `https://fileshub.zaions.com/api/v1`, header `X-API-Key`.

| Method and path | Ability | What it does |
|---|---|---|
| `GET /passwords` | list | Your reachable passwords, favourites first. Filters: `q` (title, username, website), `website` (host), `tag`, `favorite`, `trashed=only` (Recently Deleted), and `project_id` for every-project admin keys. Paginated (`per_page` ≤ 50). Never returns a password. |
| `POST /passwords` | create | `title` and `password` required; `websites` (list), `username`, `totp_secret` (base32 key or `otpauth://` link), `notes`, `tags` (list), `is_favorite`. Every-project admin keys may send `project_id`. 201 with the entry. |
| `GET /passwords/{id}` | list | One entry: details, strength (`weak` / `fair` / `strong` / `very strong`), whether the password is reused in the project, `has_verification_code`. |
| `POST /passwords/{id}/reveal` | reveal | `password`, `username` and the current `verification_code` (`code`, `expires_in` seconds). `{"history": true}` adds the last 10 earlier passwords. Audited. |
| `PATCH /passwords/{id}` | update | Any field above. A new password moves the old one into the history. |
| `DELETE /passwords/{id}` | delete | Moves it to Recently Deleted. `?permanent=1` on a deleted entry removes it for good (409 otherwise). |
| `POST /passwords/{id}/restore` | delete | Brings it back from Recently Deleted. |
| `POST /passwords/generate` | create or update | A strong password, stored nowhere. Default `style: grouped` (`abcdef-gh2jkl-Mnopqr`); `style: random` takes `length` (8–128), `symbols`, `numbers`, `uppercase`. |

```bash
curl -s https://fileshub.zaions.com/api/v1/passwords \
  -H "X-API-Key: $FILESHUB_KEY" -H "Content-Type: application/json" \
  -d '{"title":"Registrar","websites":["registrar.example.com"],"username":"ops@example.com","password":"abcdef-gh2jkl-Mnopqr"}'
```

## Granting a scope over the Management API

`PATCH /api/public/v1/projects/{project}/api-keys/{key}` (and key creation) accepts `password_scope`
(`none` / `own` / `admin`), `password_all_projects` and `password_abilities`. Changing any of them needs
`can_manage_passwords` on the calling token; `password_all_projects: true` also needs an all-projects token.
Otherwise the request answers 422 and nothing changes.
