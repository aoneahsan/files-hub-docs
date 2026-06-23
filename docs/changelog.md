---
sidebar_position: 7
title: Changelog
description: Notable changes to the FilesHub documentation site, latest first.
keywords: [fileshub changelog, docs changelog, release notes]
last_update:
  date: 2026-06-23
  author: Ahsan Mahmood
---

# Changelog

Notable changes to this documentation site, latest first. The FilesHub product's own release notes live with the app at [fileshub.zaions.com](https://fileshub.zaions.com).

## 2026-06-23 — Initial public docs

- Launched `docs.fileshub.zaions.com` as the public FilesHub documentation site (Docusaurus, hosted on Firebase Hosting + GitHub Pages).
- Documented the storage **object API**: [upload](api/upload-object), [download](api/get-object), [list](api/list-objects), and [delete](api/delete-object), with exact request/response shapes and the `{ "message": ... }` error envelope.
- Added **Getting Started**: [Quick Start](getting-started/quick-start), [Authentication](getting-started/authentication) (`X-API-Key`, permissions, restrictions), and [File visibility](getting-started/file-visibility) (`public` vs `private`).
- Added **Integration Guides**: [Integrate from any app](guides/integrate-from-any-app) (JS/TS, React, PHP/Laravel) and [Browser & mobile uploads](guides/browser-and-mobile-uploads).
- Added a [platform services](platform-services) map of the 50+ utility endpoints, an [FAQ](faq), and a [Privacy](privacy) note.
- Added SEO/AI-discovery files: `robots.txt` (AI-bot allowlist), `sitemap.xml`, `llms.txt`, `llms-full.txt`, `humans.txt`, and `/.well-known/security.txt`, plus JSON-LD (WebSite, Organization, SoftwareApplication).
