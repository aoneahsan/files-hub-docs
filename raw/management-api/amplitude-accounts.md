---
sidebar_position: 9
title: Amplitude accounts
description: Record which Amplitude account holds which project, how many projects each account may hold, which FilesHub project each Amplitude project measures, and its API key, over the FilesHub Management API.
keywords: [amplitude project limit, amplitude free plan projects, amplitude account tracking, amplitude project id, amplitude api key, amplitude accounts api, analytics project inventory]
last_update:
  date: 2026-11-12
  author: Ahsan Mahmood
---

# Amplitude accounts

A free Amplitude account holds a limited number of projects, so a fleet of apps ends up spread over
several accounts. FilesHub keeps the map: each **account** has a **project limit** (5 by default, editable
per account), and each **Amplitude project** in it can be linked to the FilesHub project it measures. The
list shows `used`, `free` and the limit, so you can see at once where the next app's analytics can go.

An Amplitude project's **API key** is saved where every other FilesHub tool already reads it: the linked
FilesHub project's vault, `amplitude` service ([Project vault](./project-vault.md)). Send `api_key` with
the project and FilesHub writes it there. The Amplitude record keeps no copy of its own, so readiness, the
credential checks and the generated `.env` blocks see the key straight away. The secret key goes into the
same vault service, through `PUT /projects/{project}/vault/amplitude`.

The account's **login password** is kept in the FilesHub dashboard only, encrypted. This API never takes
it and never returns it: a body carrying `password` is `422`.

Reads need any Management API token. Writes need `can_write_vault` (`403 TOKEN_PERMISSION_DENIED`
otherwise). A linked FilesHub project is shown only when the token can reach it, and can only be linked when
it can.

| Method | Path | Body | Notes |
|---|---|---|---|
| `GET` | `/amplitude-accounts` | | Every account with `project_limit`, `used`, `free` and its `projects[]`. `?has_room=1` keeps active accounts with a free slot |
| `POST` | `/amplitude-accounts` | `label` (required), `email`, `organization`, `project_limit`, `is_active`, `notes` | `project_limit` defaults to 5. `password` is `422` |
| `GET` | `/amplitude-accounts/{account}` | | One account |
| `PATCH` | `/amplitude-accounts/{account}` | any of the above | A limit below the projects the account already holds is `422` |
| `POST` | `/amplitude-accounts/{account}/projects` | `name` (required), `amplitude_project_id`, `region` (`us` / `eu`), `project` (FilesHub id, ULID or slug), `api_key`, `notes` | A full account is `422` on `amplitude_account_id`; an `amplitude_project_id` already in that account is `422` |
| `PATCH` | `/amplitude-projects/{id}` | any of the above, or `amplitude_account_id` to move it | Moving into a full account is `422` |
| `DELETE` | `/amplitude-projects/{id}` | | Frees the slot. The FilesHub project and its vault, the key included, are untouched |

## The API key

- `api_key` is written to `amplitude.api_key` in the vault of the FilesHub project the Amplitude project
  is linked to: the `project` sent in the same request, or the link it already has. With no link, or a link
  the token cannot reach, the call is `422` on `api_key` and nothing is saved.
- Leave `api_key` out to keep the saved key. Send `null` to remove it, the same rule as the vault's own
  write.
- Every project row carries `api_key`: the saved key when the token can read the vault (`can_read_vault`,
  `can_reveal_vault` or `can_write_vault`) and reach the linked project, otherwise `null`. It is the
  ingestion key the browser SDK ships with, so the vault treats it as client-public.
- The vault write is audited on that FilesHub project as `public_api.vault.updated`, by field name only.

Register a new app's Amplitude project, with its key, in the first account with room:

```bash
ACC=$(curl -s "$B/amplitude-accounts?has_room=1" -H "Authorization: Bearer $TOKEN" | jq '.data[0].id')
jq -n --arg key "$AMPLITUDE_API_KEY" \
  '{name: "Rent Party", amplitude_project_id: "712345", region: "us", project: "rentparty", api_key: $key}' |
  curl -X POST "$B/amplitude-accounts/$ACC/projects" -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' -d @-
```

```json
{ "data": { "id": 4, "amplitude_account_id": 2, "name": "Rent Party", "amplitude_project_id": "712345",
            "region": "us", "project": { "id": 65, "slug": "rentparty", "name": "rentparty" },
            "api_key": "0123456789abcdef0123456789abcdef", "notes": null } }
```

A production project's [readiness](./endpoints.md#get-projectsprojectreadiness) counts its Amplitude row as
done once the key is saved; until then its hint names the linked Amplitude project, or the account with
room for one.

Every write is audited (`public_api.amplitude_account.*`, `public_api.amplitude_project.*`).
