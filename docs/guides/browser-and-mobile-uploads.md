---
sidebar_position: 2
title: Browser & mobile uploads
description: How to upload to FilesHub safely from a browser or a mobile app — multipart form data, restricted keys scoped to your domain or bundle id, and the backend-proxy alternative.
keywords: [fileshub browser upload, mobile file upload, restricted api key, x-app-id, backend proxy upload, capacitor file upload, secure client upload]
last_update:
  date: 2026-06-23
  author: Ahsan Mahmood
---

# Browser & mobile uploads

Uploading directly from a client (a browser tab or a phone) is convenient but exposes whatever key the client holds. FilesHub gives you two safe paths: a **restricted key** locked to your origin/app, or a **backend proxy** that never ships a key to the client. Choose based on how sensitive uploads are.

## Browser uploads

A browser sends the file as `multipart/form-data`. Let the browser set the `Content-Type` (so the multipart boundary is correct) and only set `X-API-Key`.

```js
const form = new FormData();
form.append('file', fileInput.files[0]);
form.append('visibility', 'public');

await fetch('https://fileshub.zaions.com/api/v1/objects', {
  method: 'POST',
  headers: { 'X-API-Key': PUBLIC_RESTRICTED_KEY }, // see below
  body: form,
});
```

### Make the browser key restricted

A key embedded in client JavaScript is readable by anyone. Mark it **restricted** in Nova and add your site's domain to its allowed-origins list. FilesHub then checks the request's `Origin`/`Referer`, so the key is useless from any other site. Use a restricted, `write`-only-where-needed key for low-risk public uploads (avatars, attachments).

### Or proxy through your backend

For anything sensitive, don't put a key in the browser at all. The browser uploads to **your** server (same-origin), and your server forwards the bytes to FilesHub with a server-side key:

```text
Browser --(multipart)--> Your API --(X-API-Key)--> FilesHub --(201 url)--> Your API --> Browser
```

This keeps the key secret and lets you validate, resize, or virus-scan before storing.

## Mobile uploads (Capacitor, React Native, native)

Mobile clients send the same multipart `POST`. If the key is **app-restricted**, include your bundle id and keep a platform user-agent:

```http
X-API-Key: fh_live_xxx
X-App-Id: com.example.myapp
User-Agent: MyApp/1.0 (Android 14)
```

```ts title="Capacitor / fetch from a WebView"
const form = new FormData();
form.append('file', blob, 'photo.jpg');
form.append('visibility', 'public');

await fetch('https://fileshub.zaions.com/api/v1/objects', {
  method: 'POST',
  headers: { 'X-API-Key': key, 'X-App-Id': 'com.example.myapp' },
  body: form,
});
```

Capacitor's WebView and most native HTTP stacks already send a platform user-agent; you usually only need to add `X-App-Id`.

## Which path should I use?

| Situation | Recommended path |
|---|---|
| Public avatars/attachments, low risk | Restricted browser/app key scoped to your domain/bundle id. |
| Anything private or business-critical | Backend proxy — key never leaves your server. |
| Need to validate/transform before storing | Backend proxy. |

When in doubt, proxy. It costs one extra hop and removes the entire class of leaked-client-key problems. See [Authentication](../getting-started/authentication) for how restrictions are enforced and [File visibility](../getting-started/file-visibility) for `public` vs `private`.
