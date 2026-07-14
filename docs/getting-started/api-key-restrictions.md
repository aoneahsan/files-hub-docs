---
sidebar_position: 4
title: API key restrictions (ship a key in a frontend)
description: Restrict a FilesHub API key to your own web origins, Android package + signing certificate, or iOS bundle id — so you can embed the key in a React/mobile app without a proxy backend.
keywords: [fileshub api key restriction, restrict api key origin, allowed origins, android signing certificate, X-App-Id, X-Android-Cert, frontend api key, no backend, sha256 fingerprint]
last_update:
  date: 2026-07-14
  author: Ahsan Mahmood
---

# API key restrictions

**Restrict a key to your own app so you can ship it in the frontend.** A restricted key only works when the request comes from an origin or app you allowlisted — a web domain, an Android package (optionally pinned to its signing certificate), or an iOS bundle id. That lets a React, Capacitor, or native app call FilesHub directly, with no proxy backend just to hide the key.

## The `restricted` flag

Every key has a `restricted` toggle (set it in the admin panel, on the key's **Restricted** field):

- **`restricted` off** (default) — the key works from anywhere. Use this for server-side keys kept in an environment variable.
- **`restricted` on** — every request is checked against the key's **allowed origins**. A restricted key with **no** origins configured **denies everything** — add at least one origin.

You add origins as child rows on the key, each with a **type** (`domain`, `android`, or `ios`) and a **value**.

## Web origins

For a browser app, add a `domain` origin. The browser sends the `Origin` header automatically on cross-site requests, and FilesHub matches it against your allowlist.

| Value | Matches |
|---|---|
| `example.com` | `https://example.com` (exact host) |
| `https://app.example.com` | that exact host (the scheme/path are normalized away) |
| `*.example.com` | any subdomain — `app.example.com`, `admin.example.com` — and the bare `example.com` |

```js title="Browser fetch — the Origin header is automatic"
await fetch('https://fileshub.zaions.com/api/v1/objects', {
  method: 'POST',
  headers: { 'X-API-Key': 'fh_live_xxx' }, // restricted to example.com
  body: form,
});
```

You do not set `Origin` yourself — the browser does. Add every domain your app is served from (production, staging, and `localhost` while developing, if you want local calls to work).

## Android apps

For an Android app, add an `android` origin whose value is your **package name** (application id, e.g. `com.example.myapp`). Your app sends it in a header:

```
X-App-Id: com.example.myapp
```

`X-Android-Package` is accepted as an alias for `X-App-Id`.

### Pinning the signing certificate (recommended)

Package names are public, so anyone can claim yours. Pin the **signing certificate** to close that gap: add one or more SHA-256 (or SHA-1) fingerprints to the android origin. When any fingerprint is set, requests **must** send a matching one in `X-Android-Cert`, or they are rejected.

Get your fingerprint from the keystore or Play Console:

```bash title="From your upload/signing keystore"
keytool -list -v -keystore your-release.jks -alias your-alias
# copy the "SHA256:" (or "SHA1:") line
```

Or in **Play Console → your app → Test and release → App integrity → App signing**, copy the **App signing key** SHA-256 (and, if you also allow direct-installed builds, the **Upload key** SHA-256). Add every fingerprint you ship under.

Paste fingerprints into the origin's **SHA-256 Fingerprints** box (one per line; colons are optional — `AB:CD:…` and `abcd…` both work).

At runtime, compute the current signing cert's SHA-256 and send it:

```kotlin title="Android — compute the signing-cert SHA-256"
import android.content.pm.PackageManager
import java.security.MessageDigest

fun signingCertSha256(context: android.content.Context): String {
    val pm = context.packageManager
    val sigs = if (android.os.Build.VERSION.SDK_INT >= 28) {
        pm.getPackageInfo(context.packageName, PackageManager.GET_SIGNING_CERTIFICATES)
          .signingInfo!!.apkContentsSigners
    } else {
        @Suppress("DEPRECATION")
        pm.getPackageInfo(context.packageName, PackageManager.GET_SIGNATURES).signatures!!
    }
    val digest = MessageDigest.getInstance("SHA-256").digest(sigs[0].toByteArray())
    return digest.joinToString(":") { "%02X".format(it) }
}
```

Send both headers on every FilesHub call:

```kotlin
connection.setRequestProperty("X-API-Key", "fh_live_xxx")
connection.setRequestProperty("X-App-Id", context.packageName)
connection.setRequestProperty("X-Android-Cert", signingCertSha256(context))
```

In a **Capacitor / hybrid** app, compute the fingerprint once in native code (a tiny plugin or `@capacitor/device`-style bridge), then attach the two headers in your JS HTTP layer. FilesHub allows `X-Android-Package` / `X-Android-Cert` through CORS, so WebView `fetch` works.

> If you configure no fingerprints, the android origin matches on package name alone — simpler, but weaker.

## iOS apps

Add an `ios` origin whose value is your **bundle id** (e.g. `com.example.myapp`), and send it as:

```
X-App-Id: com.example.myapp
```

iOS uses bundle-id matching (no certificate pinning).

## How honest is this? (read before you rely on it)

`X-App-Id` and `X-Android-Cert` are **self-declared headers**. This is the same trust model as Google Maps' Android API-key restrictions: it stops your key from being reused on **other** sites and apps, which is what makes shipping a public client key practical. It is **not** cryptographic device attestation — a determined attacker who fully reverse-engineers your app can replay its headers.

So restrictions are the right tool for a **public client key** whose blast radius you accept (public file uploads, utility calls). They are **not** a substitute for a server when the operation is sensitive: keep high-privilege keys, secrets, and anything you cannot afford to have abused on a backend or proxy, and consider Play Integrity / App Attest if you need real attestation.

## When you still want a proxy backend

- The key needs high-privilege scopes (bulk delete, admin utilities) you cannot risk being replayed.
- You must enforce per-user quotas or business rules the client cannot be trusted with.
- You need real device attestation, not header allowlisting.

In those cases, route calls through a small backend (a Cloudflare Worker is enough) that holds an unrestricted server key and applies your own checks.

## Quick reference

| Platform | Add origin type | Value | Headers the app sends |
|---|---|---|---|
| Web | `domain` | `example.com` or `*.example.com` | `Origin` (automatic) |
| Android | `android` | `com.example.myapp` | `X-App-Id` (+ `X-Android-Cert` if pinned) |
| iOS | `ios` | `com.example.myapp` | `X-App-Id` |

A rejected request returns `403` with a short reason (`Origin / app not allowed. …`). See [Errors & limits](../api/errors-and-limits).
