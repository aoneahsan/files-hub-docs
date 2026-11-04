---
sidebar_position: 3
title: File visibility (public vs private)
description: Each FilesHub object is public or private. Public objects are downloadable by anyone at their URL; private objects require a read-permission API key from the same project.
keywords: [fileshub visibility, public file, private file, file access control, public url file storage, private download api key]
last_update:
  date: 2026-06-23
  author: Ahsan Mahmood
---

# File visibility (public vs private)

**Every object you upload is either `public` or `private`, set with the `visibility` field on upload.** Visibility decides who can download the object at its URL.

| Visibility | Who can download | Typical use |
|---|---|---|
| `public` | Anyone with the URL — no key needed. | Avatars, images rendered in a page, shareable links, public exports. |
| `private` | Only a `read`-permission key from the **same project**. | Invoices, user documents, anything that must stay behind your app. |

## The integration default is `public`

Across Aoneahsan/Zaions apps, the convention is to upload with **`visibility: public`**. Public objects render directly in an `<img>`/`<a>` and download without an extra authenticated round-trip, which keeps client code simple and avoids proxying bytes through your own server. Send `visibility=public` explicitly on upload — the server-side default when the field is omitted is `private`.

```bash
curl -X POST https://fileshub.zaions.com/api/v1/objects \
  -H "X-API-Key: fh_live_xxx" \
  -F "file=@avatar.png" \
  -F "visibility=public"
```

## When to choose `private`

Use `private` when the file must never be openable by URL alone — a contract, a medical record, a paid download. Your server then fetches the bytes with a `read` key and streams them to the authorised user, so FilesHub never serves the file to an anonymous request.

```js title="Fetch a private object server-side"
const res = await fetch(`https://fileshub.zaions.com/api/v1/objects/${publicId}`, {
  headers: { 'X-API-Key': process.env.FILESHUB_READ_KEY },
});
// pipe res.body to your authorised user
```

A `private` object requested **without** a key returns `401`; requested with a key that lacks `read` returns `403`; requested with a key from a different project returns `404` (so existence isn't leaked).

## Public does not mean listed

A `public` object is reachable only by its ULID URL, which is unguessable. It is not browsable or enumerable by outsiders — listing requires a `read` key (see [List objects](../api/list-objects)). "Public" means "anyone who has the link can open it," similar to an unlisted link.

## Changing your mind

Visibility is set at upload time. To change a file's visibility, re-upload it with the desired `visibility` and delete the old object. Pick the right value up front based on whether the URL should be openable without your app.
