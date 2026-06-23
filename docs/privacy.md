---
sidebar_position: 6
title: Privacy
description: Privacy notice for the FilesHub documentation site and the FilesHub API — what the docs site collects, what the API stores, and how to get data removed.
keywords: [fileshub privacy, documentation privacy, api data handling, file deletion, data removal]
last_update:
  date: 2026-06-23
  author: Ahsan Mahmood
---

# Privacy

This page covers two things: the privacy of **this documentation site**, and a short note on how the **FilesHub API** handles data. The authoritative product privacy policy lives on the FilesHub app at [fileshub.zaions.com](https://fileshub.zaions.com).

## This documentation site

This site (`docs.fileshub.zaions.com`) is a static Docusaurus site hosted on Firebase Hosting and GitHub Pages.

- **No accounts, no tracking cookies, no advertising.** The site does not ask you to sign in and sets no marketing cookies.
- **Server logs.** The hosting providers (Firebase/GitHub) keep standard access logs (IP, user-agent, requested path) for security and operations. These are governed by their own privacy policies.
- **No analytics SDKs are bundled** in this docs site. If that changes, this page and the site footer will say so.

## The FilesHub API (summary)

When your application calls the FilesHub API:

- **Files you upload** are stored on the FilesHub server and addressed by a ULID. They are deleted when you call `DELETE /api/v1/objects/{public_id}` or when an `expires_at` you set passes.
- **API keys** identify the project making the request; FilesHub records request metadata for rate limiting, auditing, and security.
- **Visibility you choose** (`public`/`private`) controls who can download a file — see [File visibility](getting-started/file-visibility).
- FilesHub does not sell data and uploads files to its own storage, not a third-party object store.

You are the controller of the files your app uploads; FilesHub is the processor that stores and serves them on your behalf.

## Removing data

- Delete a specific file: `DELETE /api/v1/objects/{public_id}` (removes the record and the bytes).
- Set files to auto-expire on upload with `expires_in_days` / `expires_at`.
- For account-level or bulk removal, contact [aoneahsan@gmail.com](mailto:aoneahsan@gmail.com).

## Contact

Questions about privacy: [aoneahsan@gmail.com](mailto:aoneahsan@gmail.com) · [aoneahsan.com](https://aoneahsan.com). Security disclosures: [`/.well-known/security.txt`](https://docs.fileshub.zaions.com/.well-known/security.txt).
