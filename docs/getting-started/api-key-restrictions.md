---
sidebar_position: 4
title: API key restrictions (ship a key in a frontend)
description: Restrict a FilesHub API key to your own web origins, browser-extension ids, Android package + signing certificate, or iOS bundle id — so you can embed the key in a React/mobile/extension app without a proxy backend.
keywords: [fileshub api key restriction, restrict api key origin, allowed origins, android signing certificate, X-App-Id, X-Android-Cert, frontend api key, no backend, sha256 fingerprint, chrome-extension origin, allow_no_origin]
last_update:
  date: 2026-07-18
  author: Ahsan Mahmood
---

# API key restrictions

**Restrict a key to your own app so you can ship it in the frontend.** A restricted key only works when the request comes from an origin or app you allowlisted — a web origin, a browser-extension id, an Android package (optionally pinned to its signing certificate), or an iOS bundle id. That lets a React, Capacitor, extension, or native app call FilesHub directly, with no proxy backend just to hide the key.

## The `restricted` flag

Every key has a `restricted` toggle (set it in the admin panel, on the key's **Restricted** field):

- **`restricted` off** (default) — the key works from anywhere. Use this only for a key you can keep secret.
- **`restricted` on** — every request is checked against the key's **allowed origins**, plus any **global origins** the administrator has configured. A restricted key with no origins of either kind **denies everything**.

You add origins as child rows on the key, each with a **type** (`domain`, `android`, or `ios`) and a **value**.

## Web origins

For a browser app, add a `domain` origin. The browser sends the `Origin` header automatically, and FilesHub matches it against your allowlist.

**Scheme and port are part of the origin and are matched exactly** — an entry is stored as `scheme://host[:port]`, which is precisely what a browser sends. A bare host is canonicalized on save, so `example.com` becomes `https://example.com`.

| Value | Matches |
|---|---|
| `example.com` → `https://example.com` | `https://example.com` only (not `http://`, not another port) |
| `*.example.com` | any subdomain over https — `app.example.com`, `admin.example.com` — and the bare `example.com` |
| `http://localhost:3843` | that port only |
| `http://localhost:*` | any port on localhost |
| `https://localhost` | the Capacitor **Android** WebView origin |
| `capacitor://localhost` | the Capacitor **iOS** WebView origin |

`http://`, `capacitor://` and `ionic://` are accepted for localhost and private IPs only; typing `http://` on a public host is rejected rather than silently upgraded, so you are never left believing you allowed an origin the browser will not send.

## Browser extensions

An extension page or service worker sends its own origin, so add a `domain` origin with the extension scheme — the **host is the extension id**:

```
chrome-extension://ihafdbecgnhendhckoknblmcminoikdb
```

`moz-extension://<uuid>` and `safari-web-extension://<uuid>` work the same way. These carry no port and no wildcard.

> Only **Chrome** extension ids are stable (fixed once you publish, or once your manifest pins a `key`). A Firefox or Safari extension id is a **per-install UUID**, so such an entry only ever matches one machine — for those, rely on your other origins.

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

## Server-side consumers: `allow_no_origin`

A restricted key refuses any request that sends **neither** an `Origin` **nor** an `X-App-Id` header. Browsers always send `Origin` — but Laravel/Guzzle, Cloudflare Workers, Node CLIs and Flutter's `dart:io` send none, so a key used from a backend could not be restricted at all.

Turn on the key's **Allow No Origin** flag and it accepts header-less requests, while every request that *does* carry an `Origin` is still matched against the allowlist. So a browser cannot borrow the key for another site, and your server keeps working.

Be clear about the guarantee: the absence of a header proves nothing, so `curl` also passes. This is **weaker** than an origin check and **much stronger** than leaving the key unrestricted — use it for keys that otherwise have no restriction at all.

## Global origins

An administrator can register origins that **every** restricted key accepts, across every project — typically local dev hosts and the Capacitor WebView origins. They apply automatically and never appear in a key's own origin list, so a key with no rows of its own may still accept those. Global origins are dashboard-managed; there is no API for them.

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
| Web | `domain` | `https://example.com` or `*.example.com` | `Origin` (automatic) |
| Local dev | `domain` | `http://localhost:5173` or `http://localhost:*` | `Origin` (automatic) |
| Browser extension | `domain` | `chrome-extension://<id>` | `Origin` (automatic) |
| Capacitor Android / iOS WebView | `domain` | `https://localhost` / `capacitor://localhost` | `Origin` (automatic) |
| Android native | `android` | `com.example.myapp` | `X-App-Id` (+ `X-Android-Cert` if pinned) |
| iOS native | `ios` | `com.example.myapp` | `X-App-Id` |
| Server / CLI / Flutter | — | set **Allow No Origin** on the key | none |

A rejected request returns `403` with a short reason (`Origin / app not allowed. …`). See [Errors & limits](../api/errors-and-limits).
