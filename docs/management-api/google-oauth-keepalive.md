---
sidebar_position: 10
title: Google OAuth clients and keep-alive
description: Import every Google OAuth client a project owns from Firebase, google-services.json and Supabase, and keep each one in use daily so Google never deletes it as unused.
keywords: [google oauth client deleted unused, keep oauth client active, inactive oauth clients deletion, refresh token keep alive, firebase oauth client id, google-services.json oauth_client, supabase google provider client id, oauth client inventory api]
last_update:
  date: 2026-09-11
  author: Ahsan Mahmood
---

# Google OAuth clients and keep-alive

Google **deletes an OAuth client that has made no token request — and had no settings edit — for six
months.** It emails you 30 days before, and a deleted client can be restored for 30 days after. For an app
that is not live yet, that is a production Google sign-in quietly broken on launch day.

FilesHub keeps an inventory of every client a project owns and uses each one every day. Available since
backend **`2026.09.11.1`**.

:::danger The keep-alive only touches a project whose switch is ON

Every project has a **`google_oauth_keepalive_enabled`** switch, **off by default**, so a client project's
OAuth tokens are never exercised. Turn it on with
`PATCH /projects/{project} {"google_oauth_keepalive_enabled": true}` (needs `can_write_vault`).
:::

## How a client is kept in use

| Client | Daily action |
| --- | --- |
| A **web** client that has been **connected** once | A real refresh-token exchange — exactly the activity Google's notice names |
| Any other client (Android, or a web client not yet connected) | A token-endpoint request with a deliberately invalid refresh token. It proves the client still **exists** and raises an alert the day it is deleted |

Connecting is a one-time Google sign-in per web client, done by the account owner in the FilesHub admin
panel. It asks only for `openid email`, so it needs no Google verification. It stores a refresh token
FilesHub can exchange unattended. The access token each exchange returns is discarded. It is **never
revoked**, because revoking an access token revokes its refresh token too.

A failed keep-alive (a deleted client, a revoked refresh token, a wrong secret) raises one notification in
the admin panel. A client that stays broken does not notify again each morning.

## Endpoints

### `GET /projects/{project}/google-oauth-clients`

The inventory, paginated. Never returns a secret — only whether one is stored.

```json
{ "data": [ {
  "client_id": "1234567890-abc….apps.googleusercontent.com",
  "client_type": "web", "sources": ["firebase_auth", "firebase_android_config"],
  "is_vault_primary": true, "has_client_secret": true, "has_refresh_token": true,
  "keepalive": { "enabled": true, "last_status": "ok", "last_mode": "refresh",
                 "last_run_at": "2026-09-12T04:40:03+00:00", "last_error": null } } ],
  "meta": { "current_page": 1, "per_page": 20, "total": 3 } }
```

### `POST /projects/{project}/google-oauth-clients/import`

Finds every client, **read-only** towards Google and Supabase, from:

| Source | Gives |
| --- | --- |
| `firebase_auth` | Firebase Auth's Google provider — the web client id **and its secret** |
| `firebase_android_config` | Each Android app's live `google-services.json` — Android clients with their package and signing SHA-1, plus the web client |
| `google_services_json` | The `google-services.json` stored in the project vault |
| `supabase_auth` | A linked Supabase project's Google provider |

The first two authenticate with the project's stored Firebase service account. Blank `google_cloud` vault
fields are filled: `oauth_web_client_id`, `oauth_web_client_secret`, `oauth_android_client_id` (the client
bound to the Play app-signing SHA-1, else the upload key's), and `project_number`. **A field that already
holds a different value is reported under `conflicts` and never overwritten.**

:::note No Google API lists clients created by hand
A client created manually in Cloud Console is invisible to every source above. Add it in the admin panel.
:::

### `POST /projects/{project}/google-oauth-clients/keepalive`

Runs the keep-alive for every client of the project now. `409 GOOGLE_OAUTH_KEEPALIVE_DISABLED` when the
project's switch is off.

## Buying time right now

Google counts **any settings edit** on a client as activity. For a client already flagged for deletion,
saving a change in Cloud Console resets the six-month clock immediately. Adding FilesHub's connect callback
to the client's authorised redirect URIs is a good edit to make, because Connect can then use it.
