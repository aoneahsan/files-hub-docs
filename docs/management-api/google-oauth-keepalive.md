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

:::danger The keep-alive only touches a project that is not a client's and whose switch is ON

A client project's OAuth tokens are never exercised. Two independent checks guard it, in this order:

1. **`is_client_project`** marks a client's project and **outranks the switch**. The keep-alive endpoint
   answers `409 CLIENT_PROJECT`, the daily run skips the project, and each of its clients reads
   `keepalive.enabled: false`, whatever `google_oauth_keepalive_enabled` says. Backend `2026.09.11.3`,
   deploy pending.
2. **`google_oauth_keepalive_enabled`** is **off by default**. Turn it on with
   `PATCH /projects/{project} {"google_oauth_keepalive_enabled": true}`.

Both are set on [`PATCH /projects/{project}`](./endpoints.md#patch-projectsproject) and need
`can_write_vault`. The [import](#post-projectsprojectgoogle-oauth-clientsimport) still runs on a client
project: it only reads configuration.
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
| `supabase_auth` | A linked Supabase project's Google provider — client ids only. Supabase's API returns the provider secret as a SHA-256 hash, so since backend `2026.09.11.2` no secret is taken from it |
| `vault` | Client ids already stored on the `google_cloud` vault service — `oauth_web_client_id`, `oauth_android_client_id` and `oauth_ios_client_id` — registered as web, Android and iOS clients. Since backend `2026.09.11.2` |

The first two authenticate with the project's stored Firebase service account. Blank `google_cloud` vault
fields are filled: `oauth_web_client_id`, `oauth_web_client_secret`, `oauth_android_client_id` (the client
bound to the Play app-signing SHA-1, else the upload key's), and `project_number`. **A field that already
holds a different value is reported under `conflicts` and never overwritten.**

The **primary web client** is the one written into a blank `oauth_web_client_id`. It is the web client
Firebase Auth names, else Supabase Auth's, else one from a `google-services.json`. `vault` is the lowest
priority, so a sign-in provider's client always wins. A stored value that does not end in
`.apps.googleusercontent.com` is ignored and reported in `notes`.

The report:

```json
{ "data": { "report": {
  "sources": {
    "firebase_auth": "ok",
    "firebase_android_config": "ok (2 Android app(s))",
    "google_services_json": "skipped: no firebase.google_services_json stored",
    "supabase_auth": "skipped: no Supabase project linked",
    "vault": "ok (1 client id(s))" },
  "clients_found": 3, "clients_created": 1, "clients_updated": 2,
  "vault_written": [], "conflicts": [],
  "notes": [ "Could not read the config of Android app com.example.inventory.app (HTTP 400: …The length of field 'display_name' value exceeds 63 characters.)" ] } } }
```

`sources.vault` is `ok (N client id(s))`, or `skipped: no OAuth client id stored on google_cloud`.

:::note A client created by hand needs its id recorded
No Google API lists OAuth clients created by hand in Cloud Console, so no discovery source can find one.
Add it in the admin panel, or store its id on `google_cloud` and re-run the import: the `vault` source then
registers it (since backend `2026.09.11.2`).
:::

### `POST /projects/{project}/google-oauth-clients/keepalive`

Runs the keep-alive for every client of the project now. On a client project it answers
`409 CLIENT_PROJECT` (`details: {"is_client_project": true}`), checked first. Otherwise it answers
`409 GOOGLE_OAUTH_KEEPALIVE_DISABLED` while the project's switch is off.

## Buying time right now

Google counts **any settings edit** on a client as activity. For a client already flagged for deletion,
saving a change in Cloud Console resets the six-month clock immediately. Adding FilesHub's connect callback
to the client's authorised redirect URIs is a good edit to make, because Connect can then use it.

## Troubleshooting

### An Android app's config fails with HTTP 400 and `display_name`

The import note reads `Could not read the config of Android app <package> (HTTP 400: …The length of field
'display_name' value exceeds 63 characters.)`. **The failure is on Google's side.** When the config is
requested, the Firebase Management API tries to auto-create the app's Android OAuth client. The name it
generates, `Android client for <package> (auto created by Google Service)`, is longer than Google's
63-character limit when the package name is long.

The import records the note and carries on with the other sources, so the rest of the report still holds.
To keep that Android client alive, store its id on `google_cloud.oauth_android_client_id`
([writing to the vault](./project-vault.md#writing-to-the-vault)) and re-run the import. The `vault` source
then registers it.
