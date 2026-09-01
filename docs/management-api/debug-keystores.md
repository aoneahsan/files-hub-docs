---
sidebar_position: 8
title: Debug keystores
description: Every build machine's Android debug signing key on one account-level record — SHA-1 and SHA-256 fingerprints readable without a reveal, the keystore file itself backed up, and a derived block on every project's vault payload.
keywords: [android debug keystore, debug.keystore backup, sha1 fingerprint api, sha256 fingerprint api, assetlinks json fingerprints, google sign in debug key, firebase debug fingerprint, app links verification, androiddebugkey]
last_update:
  date: 2026-09-01
  author: Ahsan Mahmood
---

# Debug keystores

A debug keystore is generated **per machine**, not per app. Every Android project you build on this laptop is
signed by the same `~/.android/debug.keystore`, so its fingerprints are a fact about the *machine* — and
storing them per project would mean writing the same two values into fifty vaults and updating fifty of them
the day you reimage.

So they live once, keyed by machine, and every project's vault payload carries them as a derived block.

Available since backend **`2026.08.31.2`**.

## Why you need them stored at all

Three things break in a way that does not mention signing:

- **Google Sign-In** on a debug build fails until that machine's SHA-1 is registered on the OAuth client.
- **App Links** stop verifying until the SHA-256 is in `assetlinks.json`.
- **Firebase** silently rejects a debug build whose fingerprint it has never seen.

Each one looks like an app bug. All three are a fingerprint nobody wrote down.

🔴 **And a rebuilt machine generates a NEW debug key.** Every fingerprint you registered for the old one
silently stops matching. Backing up the file is what makes that recoverable rather than a morning of
re-registering.

## The scopes — no new one

Reads use `can_read_vault`, the file download and passwords use `can_reveal_vault`, writes use
`can_write_vault`. This is deliberate: a new scope defaults to `false` on every token that already exists, so
minting one would 403 every caller until each token was edited. That cost is worth paying for a credential
(see [developer accounts](./developer-accounts.md)) and not for a **fingerprint**, which ships publicly in
`assetlinks.json` and authorises nothing on its own.

🔴 **The fingerprints are non-secret and come back on an ordinary read.** Only `store_password`,
`key_password` and the keystore file need `can_reveal_vault`. That split is the whole point — filling in an
`assetlinks.json` or an OAuth client should never require the strongest grant you have.

## Endpoints

| Call | Scope | Notes |
|---|---|---|
| `GET /debug-keystores` | read | `?q=` · `?active=`. Paginated |
| `POST /debug-keystores` | write | `machine_id` is the key |
| `GET /debug-keystores/{machine}` | read | `{machine}` is the machine id, e.g. `linux-ahsan` |
| `PATCH /debug-keystores/{machine}` | write | |
| `DELETE /debug-keystores/{machine}` | write | |
| `POST /debug-keystores/{machine}/file` | write | Upload `debug.keystore` — multipart, or `{filename, content_base64}` |
| `GET /debug-keystores/{machine}/file` | reveal | Raw bytes + `X-Checksum-Sha256` |
| `POST /debug-keystores/{machine}/reveal` | reveal | The passwords |

There is deliberately **no** `projects/{project}/debug-keystores` pair. A debug keystore is not assigned to a
project — every project on that machine is signed by it — so an assignment endpoint would imply a choice that
does not exist.

## The payload

```json
{
  "machine_id": "linux-ahsan",
  "label": "Linux workstation P51",
  "os": "linux", "arch": "x64", "hostname": "ahsan-ThinkPad-P51",
  "alias": "androiddebugkey",
  "sha1": "28:25:0F:…",
  "sha256": "46:82:DC:…",
  "valid_from": "2025-11-10T21:41:00+00:00",
  "valid_until": "2055-11-03T21:41:00+00:00",
  "is_active": true,
  "has": { "store_password": true, "key_password": true, "keystore_file": true },
  "file": { "filename": "debug.keystore", "size_bytes": 2734, "sha256": "…" },
  "download": "/api/public/v1/debug-keystores/linux-ahsan/file"
}
```

Read presence from `has`, never from `file` alone — a stored file whose password is missing is an unopenable
blob, and `has.keystore_file: true` on its own makes it read as finished.

## Getting a machine's values

Android's debug keystore uses documented constants — alias `androiddebugkey`, password `android` — so nothing
here is a secret you have to invent:

```bash
keytool -list -v -keystore ~/.android/debug.keystore \
  -alias androiddebugkey -storepass android -keypass android
```

🔴 **Take the fingerprints from `keytool`, never from a filename or a note.** They are the only thing a
verifier compares, and a transposed pair fails in a way that names nothing.

## On every project

Each project's vault payload carries a derived `debug_keystores` block listing every active machine, with
fingerprints and **no passwords**. It is computed, not stored, so it cannot drift from the records above and
there is nothing to keep in sync.

## The three Android fingerprints are three different keys

Mixing them up is the usual cause of a sign-in or App-Links failure that looks like an app bug:

| Key | Where it lives | What signs with it |
|---|---|---|
| **Play App Signing** | project vault, `play_console.app_signing_sha1` / `_sha256` | What users actually install — Google re-signs your upload |
| **Upload keystore** | project vault, `capacitor.upload_sha1` / `_sha256` | What you upload to Play |
| **Debug keystore** | here, per machine | Every debug build on that machine |

All three are non-secret and readable without a reveal. The keystore *files* and their passwords stay secret.
