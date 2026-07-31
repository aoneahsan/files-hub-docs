---
sidebar_position: 7
title: Changelog
description: Notable changes to the FilesHub documentation site, latest first.
keywords: [fileshub changelog, docs changelog, release notes]
last_update:
  date: 2026-07-31
  author: Ahsan Mahmood
---

# Changelog

Notable changes to this documentation site, latest first. The FilesHub product's own release notes live with the app at [fileshub.zaions.com](https://fileshub.zaions.com).

## 2026-07-31 — Project vault

- New page: **[Project vault](management-api/project-vault)**. FilesHub now stores every third-party credential, config file and identifier a project needs — Firebase, Google Cloud, Sentry, OneSignal, Clarity, Amplitude, Cloudflare, Capacitor signing, GitHub, the three store consoles, OpenAI, SMTP, plus a freeform bucket — and reads them back over the Management API, including ready-to-paste `.env` blocks for Vite, Next, Node and Laravel. Supabase is *linked* to the existing [account-wide vault](management-api/supabase-projects) rather than duplicated.
- **Two new opt-in token scopes**, both off by default and documented in [Authentication](management-api/authentication): `can_read_vault` sees metadata and *which* credentials exist — presence flags, never a value — while `can_reveal_vault` sees the values, the file bytes and the env blocks. A token missing one gets `403 TOKEN_PERMISSION_DENIED` with `details.required_scope`, not the anti-enumeration `404` used for resources; that distinction is now stated in the [endpoint reference](management-api/endpoints) error table.
- `GET /vault/services` publishes the **field registry itself** — every field's label, where in that console to find it, whether it is secret, whether it may ship in a browser bundle, and its `.env` name. Schema discovery, so an agent never has to guess what a project can hold.
- The generated `VITE_` / `NEXT_PUBLIC_` blocks contain **only** fields marked `client_safe`, and a field marked `secret` is always `client_safe: false`. A server secret is structurally unable to appear in a client env block rather than merely omitted by convention.
- [OpenAPI spec](https://fileshub-docs.zaions.com/openapi.json) extended to **1.1.0**: 7 new paths and 8 new schemas, all using the 3.1 nullable form. The [agent workflow](management-api/agent-workflow) gained a bootstrap-a-machine-from-the-vault recipe.

## 2026-07-30 — Global origins are readable over the Management API

- Documented two read-only endpoints — **`GET /global-origins`** and **`POST /global-origins/check`** — in the [endpoint reference](management-api/endpoints). Global origins apply to every restricted key and never appear in a key's own list, so previously there was no way to see them over the API; the docs said outright that none existed. Writes stay in the dashboard. The [agent workflow](management-api/agent-workflow) now checks coverage *before* adding origins and adds only what comes back `covered: false`, and [API key restrictions](getting-started/api-key-restrictions) records that the read API exists.
- The check endpoint runs the same matcher request-time enforcement uses, because coverage is **not** string equality: `https://*.example.com` covers its subdomains *and* the bare apex, an apex rule covers no subdomain, and `http://localhost:*` covers every port. Extended the [OpenAPI spec](https://fileshub-docs.zaions.com/openapi.json) with both paths and the `GlobalOriginPublic` / `GlobalOriginCheckResult` schemas, and added the guidance to `llms.txt` / `llms-full.txt`.
- **Fixed 49 wrongly-typed nullable fields in the [OpenAPI spec](https://fileshub-docs.zaions.com/openapi.json).** The spec declares OpenAPI 3.1, but 49 properties used the **3.0** `nullable: true` keyword. 3.1 removed that keyword, so it was being ignored — meaning the published spec asserted those 49 fields were **non-nullable while the API genuinely returns `null`**, and any client generated from it got the wrong types. They now use the 3.1 form, `"type": ["string", "null"]`. If you generated a client from this spec before today, regenerate it. No API behaviour changed; only the description of it was wrong.

## 2026-07-22 — Supabase project vault (Management API)

- Documented the **[Supabase project vault](management-api/supabase-projects)** — read and **reveal** a registered Supabase project's full credential set (API keys, JWT secret, Postgres connection details, S3 keys) plus ready-to-paste React/Node/Laravel `.env` blocks, over the Management API. Gated by the new **`can_manage_supabase`** access-token scope (off by default), which is a separate axis from the project scope.
- Extended the [OpenAPI spec](https://fileshub-docs.zaions.com/openapi.json) with the `/api/public/v1/supabase-projects` endpoints (list, show, reveal) and added `can_manage_supabase` to the token introspection; noted the scope in [overview](management-api/overview) and [authentication](management-api/authentication), and added a Supabase section to `llms.txt` / `llms-full.txt`.

## 2026-07-18 — Management API

- Documented the new **[Management API](management-api/overview)** — a server-side control plane that manages projects, API keys, and origin restrictions with a user-level `fh_pat_` access token: [overview](management-api/overview), [authentication](management-api/authentication), the [endpoint reference](management-api/endpoints), and an [AI agent workflow](management-api/agent-workflow) for auto-configuring a project's API key.
- Extended the [OpenAPI spec](https://fileshub-docs.zaions.com/openapi.json) with the `/api/public/v1/*` endpoints under a new `BearerAuth` scheme, and added a Management API section to `llms.txt` / `llms-full.txt`.

## 2026-07-14 — Full API docs + AI surfaces, GitHub Pages

- Moved to **`fileshub-docs.zaions.com`** on **GitHub Pages** as the single host (Firebase Hosting removed).
- Documented the **email API**: [send](api/emails-send) (raw + template, multi-domain, queued), [templates](api/email-templates), and [recurring schedules](api/email-schedules).
- Documented **[jobs](api/jobs)** (poll queued operations) and **[version & health](api/version-health)**.
- Added **[API key restrictions](getting-started/api-key-restrictions)** — ship a key in a React/mobile frontend with web-origin, Android package + signing-cert, and iOS bundle-id allowlisting.
- Added AI-agent surfaces: an **[OpenAPI 3.1 spec](api/openapi)** at [`/openapi.json`](https://fileshub-docs.zaions.com/openapi.json) and a **raw-Markdown mirror** of every page under `/raw/` (index at [`/raw/manifest.json`](https://fileshub-docs.zaions.com/raw/manifest.json)), with a "View raw Markdown" link on each page.
- Added a summarized **[developer utilities index](api/utilities-index)** and expanded the [API overview](api/overview) with scopes and the full endpoint map.

## 2026-06-23 — Initial public docs

- Launched `fileshub-docs.zaions.com` as the public FilesHub documentation site (Docusaurus, hosted on Firebase Hosting + GitHub Pages).
- Documented the storage **object API**: [upload](api/upload-object), [download](api/get-object), [list](api/list-objects), and [delete](api/delete-object), with exact request/response shapes and the `{ "message": ... }` error envelope.
- Added **Getting Started**: [Quick Start](getting-started/quick-start), [Authentication](getting-started/authentication) (`X-API-Key`, permissions, restrictions), and [File visibility](getting-started/file-visibility) (`public` vs `private`).
- Added **Integration Guides**: [Integrate from any app](guides/integrate-from-any-app) (JS/TS, React, PHP/Laravel) and [Browser & mobile uploads](guides/browser-and-mobile-uploads).
- Added a [platform services](platform-services) map of the 50+ utility endpoints, an [FAQ](faq), and a [Privacy](privacy) note.
- Added SEO/AI-discovery files: `robots.txt` (AI-bot allowlist), `sitemap.xml`, `llms.txt`, `llms-full.txt`, `humans.txt`, and `/.well-known/security.txt`, plus JSON-LD (WebSite, Organization, SoftwareApplication).
