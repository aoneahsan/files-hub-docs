---
sidebar_position: 1
title: Integrate from any app
description: Copy-paste FilesHub integration for JavaScript/TypeScript, React, PHP/Laravel, and mobile — upload a file, store the returned URL, render it, and clean it up on delete.
keywords: [fileshub integration, upload file react, upload file laravel, file storage integration, file upload axios, file upload php, store returned url]
last_update:
  date: 2026-06-23
  author: Ahsan Mahmood
---

# Integrate from any app

FilesHub has no required SDK — you call it over plain HTTP, so it works from any language or framework. The pattern is always the same: **upload the bytes, store the returned `url`, render the `url`, delete the object when the record goes away.** This guide gives ready-to-adapt snippets.

## The four-step pattern

1. **Upload** with a `write` key → keep `url` (and `public_id`).
2. **Save** `url` on your own database record.
3. **Render** `url` directly (public objects) or proxy it (private objects).
4. **Delete** the object when you delete the record, so storage doesn't accumulate orphans.

## JavaScript / TypeScript

```ts title="A tiny typed helper"
const BASE = 'https://fileshub.zaions.com/api/v1';

export type FilesHubObject = {
  public_id: string;
  url: string;
  mime_type: string;
  size_bytes: number;
  visibility: 'public' | 'private';
  expires_at: string | null;
};

export async function uploadFile(
  file: File | Blob,
  key: string,
  visibility: 'public' | 'private' = 'public',
): Promise<FilesHubObject> {
  const form = new FormData();
  form.append('file', file);
  form.append('visibility', visibility);

  const res = await fetch(`${BASE}/objects`, {
    method: 'POST',
    headers: { 'X-API-Key': key }, // never set Content-Type for multipart
    body: form,
  });
  if (!res.ok) throw new Error((await res.json()).message ?? 'Upload failed');
  return res.json();
}

export async function deleteFile(publicId: string, key: string): Promise<void> {
  const res = await fetch(`${BASE}/objects/${publicId}`, {
    method: 'DELETE',
    headers: { 'X-API-Key': key },
  });
  if (!res.ok && res.status !== 404) throw new Error('Delete failed');
}
```

## React

```tsx
function AvatarUpload({ apiKey }: { apiKey: string }) {
  const [url, setUrl] = React.useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const object = await uploadFile(file, apiKey, 'public');
    setUrl(object.url); // persist object.url on your user record server-side
  }

  return (
    <>
      <input type="file" accept="image/*" onChange={onChange} />
      {url && <img src={url} alt="avatar" width={96} height={96} />}
    </>
  );
}
```

For production, route uploads through your backend so the `write` key stays server-side, or use a restricted browser key scoped to your domain (see [Authentication](../getting-started/authentication)).

## PHP / Laravel

```php
use Illuminate\Support\Facades\Http;

$object = Http::withHeaders(['X-API-Key' => config('services.fileshub.key')])
    ->attach('file', file_get_contents($path), basename($path))
    ->post('https://fileshub.zaions.com/api/v1/objects', ['visibility' => 'public'])
    ->throw()
    ->json();

$user->update(['avatar_url' => $object['url'], 'avatar_object_id' => $object['public_id']]);
```

## Mobile (Capacitor / React Native / native)

Mobile apps `POST` the same multipart request. If your key is app-restricted, add `X-App-Id` with your bundle id and keep a platform user-agent (Capacitor's WebView and native HTTP clients send one). See [Browser & mobile uploads](browser-and-mobile-uploads) for platform specifics.

## Keep storage clean

When a user removes their avatar or you delete a record that owned a file, call `DELETE /api/v1/objects/{public_id}` so the stored bytes are removed too. Pairing every "create object" with a "delete object on teardown" is the single most important habit for a tidy FilesHub project.

## Choose visibility deliberately

Send `visibility: public` for anything you render by URL; use `private` and a server-side `read` key for files that must stay behind your app. See [File visibility](../getting-started/file-visibility).
