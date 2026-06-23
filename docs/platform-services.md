---
sidebar_position: 4
title: Platform services (beyond storage)
description: Beyond file storage, FilesHub exposes 50+ stateless developer-utility endpoints on the same base URL and X-API-Key — hashing, encoding, converters, QR codes, short URLs, OTP, a vault, and image/PDF processing.
keywords: [fileshub utilities, developer api, hashing api, qr code api, short url api, otp api, encryption vault, image processing api, pdf api]
last_update:
  date: 2026-06-23
  author: Ahsan Mahmood
---

# Platform services (beyond storage)

**FilesHub is more than file storage: the same `/api/v1` base URL and the same `X-API-Key` also serve 50+ stateless developer-utility endpoints.** Most apps integrate the [object storage API](api/overview) first, then reach for these utilities as needed instead of pulling in a separate library or service for each one.

These utility endpoints are documented in detail inside the FilesHub app itself; this docs site focuses on the storage object API that nearly every project integrates. The catalogue below is an honest map of what exists so you know what FilesHub can already do for you.

## Communication & identity

| Area | What it does |
|---|---|
| **Email** | Send transactional email through configured providers (Gmail SMTP, Brevo, Mailtrap) with templates and per-account daily limits. |
| **OTP** | Send and verify one-time passcodes for phone/email verification flows. |
| **Notifications** | Store and fetch in-app notifications; unread counts; mark-read. |
| **Push** | Register subscriptions and send web push messages. |
| **Contact form** | Accept and store contact-form submissions from your sites. |

## Links & content

| Area | What it does |
|---|---|
| **Short URLs** | Create short links and track clicks. |
| **QR codes** | Generate QR codes (with a download endpoint). |
| **Link preview** | Fetch title/description/image metadata for a URL. |
| **Pastes** | A pastebin-style store for text snippets. |
| **Sitemap / feed** | Generate XML sitemaps and RSS feeds. |

## Developer utilities

| Area | What it does |
|---|---|
| **Hashing** | Generate and verify hashes (e.g. SHA-256). |
| **Encoding** | Base64 and URL encode/decode. |
| **Converters** | JSON ↔ CSV ↔ XML ↔ YAML, Markdown ↔ HTML, and more. |
| **Generators** | UUID / ULID / NanoID, random data, slugs, lorem ipsum. |
| **Encryption vault** | Store, retrieve, and encrypt/decrypt secrets by key. |

## Media processing

| Area | What it does |
|---|---|
| **Images** | Resize, compress, crop, and convert images. |
| **PDF** | Generate PDFs. |
| **Favicons / meta tags** | Generate favicon sets and HTML meta-tag blocks. |

## Operations

| Area | What it does |
|---|---|
| **Analytics** | Track events and read summaries. |
| **Feature flags** | Toggle features by key. |
| **App versions** | Publish and check app version info for update prompts. |
| **Webhooks** | Register endpoints and record deliveries. |
| **Uptime monitors** | Schedule checks and record results. |
| **Scheduled tasks** | Cron-style task scheduling with run history. |

## How to call them

Every utility uses the same base URL and authentication as storage:

```bash
curl -X POST https://fileshub.zaions.com/api/v1/<service>/<action> \
  -H "X-API-Key: fh_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

A key's permissions and any per-service permission gates control which utilities it may call. For exact request/response shapes of a specific utility, see its page inside the FilesHub app or ask the maintainer — these docs intentionally keep the storage API as the canonical, fully-specified surface.
