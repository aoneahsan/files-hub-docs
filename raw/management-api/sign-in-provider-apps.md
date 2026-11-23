---
sidebar_position: 8
title: Sign-in provider apps
description: Keep every OAuth and OpenID Connect app you register for a project (Google, Apple, Microsoft, GitHub and 13 more) on that project in FilesHub, with the console account you made it under, and read it back over the Management API.
keywords: [store oauth client secret, oauth app registry, apple sign in p8 key storage, google oauth client id storage, github oauth app secret, openid connect client credentials, sign-in provider credentials api, test oauth apps, fileshub management api]
last_update:
  date: 2026-11-23
  author: Ahsan Mahmood
---

# Sign-in provider apps

Every sign-in button starts with an app registered in someone else's console: a Google web client, an Apple
Services ID and its `.p8` key, a GitHub OAuth App. Each console shows its secret once, uses its own name for the
client ID (TikTok calls it a *client key*), and sits behind whichever login you happened to use that day. Weeks
later, finding the values again is the slow part.

A sign-in provider app is one of those registrations, saved on the project it was made for. A project can hold as many
as it needs: a test app and a production app per provider, or a second registration for another consumer.

Available since backend **`2026.11.23.2`**.

## What one app holds

| Part | What it is |
|---|---|
| `project` | The FilesHub project the app was registered for. You can move it later. |
| `provider` | One of the providers below. It cannot change after creation, because it decides which fields exist. |
| `environment` | `test` (the default) or `production`. |
| `account_email` | The console login you created the app under, so you know which account to sign in with next time. |
| `status` | `draft`, `registered`, `in_review`, `live` or `disabled`. |
| `label`, `notes` | Your words. Use them to tell two apps on one provider apart, name the signing key a SHA-1 belongs to, or record when a secret expires. |
| fields | The provider's own fields, named the way its console names them. |

Every provider also has these fields: redirect URLs, allowed origins, scopes, Android package name and signing SHA-1, iOS
bundle ID, and a link to the app's own page in the console.

## Providers

Google · Apple · Microsoft · Facebook · LinkedIn · X · Pinterest · TikTok · GitHub · GitLab · Slack · Discord · Twitch ·
Spotify · Login with Amazon · Yahoo · and any other provider that publishes an OpenID Connect discovery document.

`GET /sign-in-providers/registry` returns the live list with every field's label, where to find it, its type, and
whether it is secret. Read it rather than this paragraph: adding a provider is a config entry and needs no release note.

## Endpoints

| Call | Scope |
|---|---|
| `GET /sign-in-providers/registry` | any valid token |
| `GET /sign-in-providers?project=&provider=&environment=&status=&account_email=` | `can_read_vault` |
| `GET /projects/{project}/sign-in-providers` | `can_read_vault` |
| `GET /projects/{project}/sign-in-providers/{app}` | `can_read_vault` |
| `POST /projects/{project}/sign-in-providers` | `can_write_vault` |
| `PATCH /projects/{project}/sign-in-providers/{app}` | `can_write_vault` |
| `DELETE /projects/{project}/sign-in-providers/{app}` | `can_write_vault` |
| `POST /projects/{project}/sign-in-providers/{app}/reveal` | `can_reveal_vault` |

These are the [project vault](./project-vault.md) scopes, because an app belongs to one project. `{project}` takes
the numeric id, the slug or the app identifier. A project or app this token cannot reach answers `404`.

Reads return non-secret values in `values` and a `has` flag for every field, secret or not. Secrets come back only
from `/reveal`, which also returns an `env` block named `<PROVIDER>_<FIELD>`, such as `GITHUB_CLIENT_SECRET`. Each
reveal is recorded with field names only.

## Save one

```bash
curl -X POST https://fileshub.zaions.com/api/public/v1/projects/capacitor-auth-manager/sign-in-providers \
  -H "Authorization: Bearer $FILESHUB_PAT" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "github",
    "environment": "test",
    "label": "Test consumer",
    "account_email": "you@example.com",
    "status": "registered",
    "credentials": {
      "client_id": "Ov23li…",
      "client_secret": "…",
      "redirect_uris": "https://capamai-test.zaions.com/auth/callback/github"
    }
  }'
```

It answers `201` with the record and `changes`, which lists field names only. A field the provider does not declare
answers `422 UNKNOWN_SIGN_IN_PROVIDER_FIELD`, lists the fields it does declare, and stores nothing.

## Change one

- A value you leave out, or send empty, stays as it is. Only `"clear_credentials": ["client_secret"]` deletes a field.
  This rule protects stored secrets from a form that submits blank password inputs.
- `"project": "<id, slug or app identifier>"` moves the app to another project this token reaches.

## In the dashboard

Nova → Vault & Credentials → **Sign-in Provider Apps**, or the **Sign-in Provider Apps** tab on a project. Pick the
project and the provider, and the form shows that provider's fields straight away. Apple's private key gets a box
that keeps its line breaks. The list can be filtered by project, provider, environment, status and console account.
