---
sidebar_position: 12
title: Developer utilities index
description: A summarized index of FilesHub's stateless developer-utility endpoint groups — converters, hashing, encoding, generators, and more — all under /api/v1 with an X-API-Key.
keywords: [fileshub utilities, developer tools api, converters api, hashing api, encoding api, jwt api, utility endpoints]
last_update:
  date: 2026-07-14
  author: Ahsan Mahmood
---

# Developer utilities index

Beyond file storage and email, FilesHub exposes a large set of **stateless developer utilities** under `/api/v1`. This page is a map, not a full reference — each group is one line. For exact request/response schemas of the core APIs, use the [OpenAPI spec](openapi); to read any page as raw Markdown for an AI agent, append the page to `/raw/`.

## How utilities authenticate

Every utility takes `X-API-Key`. Write operations (`POST`) need the `write` permission **plus** the group's service scope (for example the converters group needs the `converter` scope). By default a new key has **all** service scopes enabled, so most keys work out of the box; a key is only blocked from a group if that scope was explicitly turned off. Restricted keys also enforce [origin/app rules](../getting-started/api-key-restrictions).

## Groups

| Group | Base path | What it does |
|---|---|---|
| Converters | `/converters/*` | Convert between formats (Markdown↔HTML, JSON↔CSV, and more). |
| Hashes | `/hashes/*` | Hash text (MD5/SHA family) and verify. |
| Encoding | `/encoding/*` | Base64 / URL / HTML encode and decode. |
| Generators | `/generators/*` | Generate UUIDs/ULIDs and other ids. |
| Tokens | `/tokens` | Generate random tokens. |
| Random | `/random/*` | Random numbers, strings, and picks. |
| Passwords | `/password/*` | Generate and strength-check passwords. |
| Colors | `/colors/*` | Convert and manipulate color values. |
| Text | `/text/*` | Text analysis and transforms. |
| Keywords | `/keywords` | Extract keywords from text. |
| Language | `/language` | Detect the language of text. |
| Spam | `/spam` | Score text for spam signals. |
| Barcodes | `/barcodes/*` | Generate barcodes. |
| JWT | `/jwt/*` | Encode, decode, and verify JSON Web Tokens. |
| SVG | `/svg/*` | Generate/transform SVG. |
| Sitemaps | `/sitemaps/*` | Build sitemap XML. |
| Feeds | `/feeds/*` | Build RSS/Atom feeds. |
| Meta tags | `/meta-tags`, `/metadata/*` | Generate and read page meta tags. |
| Favicons | `/favicons/*` | Extract or generate favicons. |
| Timezones | `/timezones/*` | Timezone lookups and conversions. |
| Cron | `/cron/*` | Parse and describe cron expressions. |
| Regex | `/regex/*` | Test and explain regular expressions. |
| Minify | `/minify/*` | Minify CSS/JS/HTML. |
| Format | `/format/*` | Pretty-print / format code and data. |
| Slugs | `/slugs` | Slugify strings. |
| Lorem | `/lorem/*` | Generate placeholder text. |
| Diff | `/diff` | Diff two texts. |
| HTML | `/html/*` | HTML utilities (sanitize, strip). |
| Markdown | `/markdown` | Render Markdown. |
| ASCII | `/ascii` | ASCII-art / conversion. |
| SQL | `/sql/*` | Format and lint SQL. |
| GraphQL | `/graphql` | GraphQL helper utilities. |
| Dates | `/date/*` | Date math and formatting. |
| Business days | `/business-days/*` | Business-day calculations. |
| Currency | `/currency/*` | Currency conversion helpers. |
| Units | `/units` | Unit conversions. |
| DNS | `/dns/*` | DNS record lookups. |
| SSL | `/ssl` | SSL certificate inspection. |
| Robots | `/robots/*` | Parse/generate robots.txt. |
| User agent | `/user-agent` | Parse a User-Agent string. |
| IP / GeoIP | `/ip/*`, `/geoip/*` | IP info and geolocation. |
| Webhook debug | `/webhook-debug/*` | Inspect inbound webhook requests. |
| Mock API | `/mock-api/*` | Serve mock API responses. |
| Duplicate | `/duplicate` | Duplicate-detection helper. |

## Stateful platform services

URL shortening, QR codes, pastes, the encryption vault, PDF/image processing, webhooks, scheduled tasks, uptime monitors, push notifications, OTP, analytics, and more are covered on [Platform services](../platform-services).

## Getting exact schemas

- **Core APIs** (objects, emails, jobs, schedules, templates, version/health): [`/openapi.json`](openapi).
- **Any doc page as raw Markdown** for an AI agent: prefix the path with `/raw/` (index at [`/raw/manifest.json`](https://fileshub-docs.zaions.com/raw/manifest.json)).
- **The full endpoint list** ships with the product — the same `X-API-Key` reaches every group above.
