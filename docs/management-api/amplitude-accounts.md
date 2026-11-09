---
sidebar_position: 9
title: Amplitude accounts
description: Record which Amplitude account holds which project, how many projects each account may hold, and which FilesHub project each Amplitude project measures, over the FilesHub Management API.
keywords: [amplitude project limit, amplitude free plan projects, amplitude account tracking, amplitude project id, amplitude accounts api, analytics project inventory]
last_update:
  date: 2026-11-09
  author: Ahsan Mahmood
---

# Amplitude accounts

A free Amplitude account holds a limited number of projects, so a fleet of apps ends up spread over
several accounts. FilesHub keeps the map: each **account** has a **project limit** (5 by default, editable
per account), and each **Amplitude project** in it can be linked to the FilesHub project it measures. The
list shows `used`, `free` and the limit, so you can see at once where the next app's analytics can go.

These are pointers. No password is stored, and an Amplitude project's API key and secret key stay in its
FilesHub project's vault, under the `amplitude` service ([Project vault](./project-vault.md)).

Reads need any Management API token. Writes need `can_write_vault` (`403 TOKEN_PERMISSION_DENIED`
otherwise). A linked FilesHub project is shown only when the token can reach it, and can only be linked when
it can.

| Method | Path | Body | Notes |
|---|---|---|---|
| `GET` | `/amplitude-accounts` | | Every account with `project_limit`, `used`, `free` and its `projects[]`. `?has_room=1` keeps active accounts with a free slot |
| `POST` | `/amplitude-accounts` | `label` (required), `email`, `organization`, `project_limit`, `is_active`, `notes` | `project_limit` defaults to 5 |
| `GET` | `/amplitude-accounts/{account}` | | One account |
| `PATCH` | `/amplitude-accounts/{account}` | any of the above | A limit below the projects the account already holds is `422` |
| `POST` | `/amplitude-accounts/{account}/projects` | `name` (required), `amplitude_project_id`, `region` (`us` / `eu`), `project` (FilesHub id, ULID or slug), `notes` | A full account is `422` on `amplitude_account_id`; an `amplitude_project_id` already in that account is `422` |
| `PATCH` | `/amplitude-projects/{id}` | any of the above, or `amplitude_account_id` to move it | Moving into a full account is `422` |
| `DELETE` | `/amplitude-projects/{id}` | | Frees the slot. The FilesHub project and its vault are untouched |

Register the Amplitude project of a new app in the first account with room:

```bash
ACC=$(curl -s "$B/amplitude-accounts?has_room=1" -H "Authorization: Bearer $TOKEN" | jq '.data[0].id')
curl -X POST "$B/amplitude-accounts/$ACC/projects" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Rent Party","amplitude_project_id":"712345","region":"us","project":"rentparty"}'
```

```json
{ "data": { "id": 4, "amplitude_account_id": 2, "name": "Rent Party", "amplitude_project_id": "712345",
            "region": "us", "project": { "id": 65, "slug": "rentparty", "name": "rentparty" }, "notes": null } }
```

Then write the project's API key into its vault (`PUT /projects/rentparty/vault/amplitude`). A production
project's [readiness](./endpoints.md#get-projectsprojectreadiness) counts the Amplitude row as done once that
key is stored; until then its hint names the linked Amplitude project, or the account with room for one.

Every write is audited (`public_api.amplitude_account.*`, `public_api.amplitude_project.*`).
