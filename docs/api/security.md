---
sidebar_position: 23
title: Security — how FilesHub protects your keys, files and passwords
sidebar_label: Security
description: How FilesHub protects stored credentials, API keys, files and passwords, which URLs it will fetch for you, the browser security headers, and two-step sign-in for the dashboard.
keywords: [fileshub security, api key security, ssrf protection, encryption at rest, two-step sign-in, 2fa, security headers]
last_update:
  date: 2026-10-24
  author: FilesHub team
---

# Security

FilesHub holds API keys, credential vaults, files and passwords for the team's apps. This page says what
protects them and what that means for a caller. Everything here is live from backend `2026.10.24.1`
(check `GET /api/version`).

## Stored secrets

- **Encrypted at rest with a key of their own.** Vault credentials, API key and token copies, passwords,
  verification-code keys and provider keys are encrypted with a key derived only for stored secrets. Nothing a
  caller can reach encrypts or decrypts with it.
- **The [encryption vault](../platform-services.md)'s stateless `encrypt`/`decrypt` routes use a different key**,
  so a ciphertext copied out of FilesHub's database cannot be decrypted through them. Those two routes are also
  **off for every API key until someone switches the key's `encryption_vault` permission on.**
- API keys and access tokens are stored as HMAC hashes and compared in constant time; the plaintext copy that
  the owner can reveal is encrypted as above.

## API keys

- An address that sends **30 invalid API keys within a minute is refused for 10 minutes** (`429`). A valid key
  is never counted, so many apps behind one shared address are not slowed.
- Origin restriction protects a key **shipped in a browser** from being used by other websites. It does not
  stop a server that copies the key and sets its own `Origin` header, so a key that can delete or reveal
  anything belongs on a server, never in a browser bundle.
- Scopes are closed by default for anything that reveals or destroys: the [password manager](passwords/access-and-scopes.md),
  email marketing, and on the Management plane every vault read, reveal and write, backups, other tokens and
  [deleting a project](../management-api/endpoints.md#delete-projectsproject) each need their own switch.
- Something out of a key's reach answers `404`, never `403`, so a key cannot learn that it exists.

## URLs FilesHub fetches for you

[Link previews](../platform-services.md), scheduled tasks, uptime monitors, outbound webhooks and the SSL checker
fetch a URL you choose. FilesHub fetches it only when:

- it is `http` or `https` (never `file:`, `gopher:` or anything else) and carries no user name or password;
- **every address its host resolves to is public**: never loopback, private networks (`10/8`, `172.16/12`,
  `192.168/16`), link-local and cloud metadata (`169.254/16`), carrier-grade NAT (`100.64/10`), IPv6 local
  ranges or multicast;
- the connection goes to the address that was checked, so DNS cannot change in between;
- a redirect is checked again the same way (at most 3, `GET`/`HEAD` only);
- the answer is at most 1 MB.

A refused URL answers `422` when you save it. One that becomes private later is refused when it runs.

## Files and images

Files are stored outside the web root under server-generated names and downloaded as attachments, so an
uploaded HTML or SVG file never runs on FilesHub's site. Image tools work only on your own project's files
(another project's file id answers `404`) and refuse pictures larger than 8000 × 8000 pixels.

## The dashboard

- Sign-in is Google only; the address must be one Google has verified.
- **Two-step sign-in is required for every admin.** After Google, the dashboard asks for a 6-digit code from
  an authenticator app, or one of ten single-use recovery codes. Five wrong codes a minute make the admin wait.
- Every secret the dashboard shows is written to the audit log, the same as an API reveal.

## Browser security headers

Every page and API answer carries `Strict-Transport-Security`, `X-Frame-Options: DENY`, a
`Content-Security-Policy` with `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, a strict
`Referrer-Policy` and a `Permissions-Policy` that turns off the camera, microphone, location and payment APIs.
No FilesHub page can be shown inside another site's frame.

## Reporting a problem

Found something that looks like a security problem? Write to the team through the
[contact page](https://fileshub.zaions.com/contact) and leave out any secret values.
