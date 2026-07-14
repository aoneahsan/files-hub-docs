---
sidebar_position: 13
title: OpenAPI spec (for AI agents & codegen)
description: FilesHub ships a machine-readable OpenAPI 3.1 spec at /openapi.json covering the core APIs — feed it to Claude Code, Codex, or an OpenAPI generator to integrate without guesswork.
keywords: [fileshub openapi, openapi 3.1, /openapi.json, ai agent api, codegen, claude code, codex, machine readable api]
last_update:
  date: 2026-07-14
  author: Ahsan Mahmood
---

# OpenAPI spec

**FilesHub ships a machine-readable OpenAPI 3.1 spec at [`/openapi.json`](https://fileshub-docs.zaions.com/openapi.json).** Point an AI coding agent or an OpenAPI generator at it to integrate FilesHub without reading prose.

```
https://fileshub-docs.zaions.com/openapi.json
```

## What it covers

The core integration surface, with full request/response schemas:

- **Objects** — upload, download, list, delete.
- **Emails** — send (raw + template), template CRUD, recurring schedules.
- **Jobs** — poll queued operations.
- **Status** — `health` and `version` (documented at `/api`, not `/api/v1`).

The security scheme is `X-API-Key` (an API-key header), and the app-restriction headers (`X-App-Id`, `X-Android-Cert`) are declared as optional parameters on secured operations.

It does **not** enumerate the 40+ stateless [developer utilities](utilities-index) — those share the same base URL and key but are summarized rather than fully schematized, to keep the spec focused on what apps integrate.

## Use it with an AI coding agent

Most coding agents accept an OpenAPI URL or file directly:

```
Read https://fileshub-docs.zaions.com/openapi.json and add a FilesHub
client to this project: upload a public file and return its URL.
```

The agent gets exact paths, the `X-API-Key` header, request bodies, and response shapes — no guessing.

## Use it with a generator

```bash title="Generate a typed client"
npx @openapitools/openapi-generator-cli generate \
  -i https://fileshub-docs.zaions.com/openapi.json \
  -g typescript-fetch -o ./fileshub-client
```

## Raw Markdown for context windows

Every documentation page is also mirrored as raw Markdown under `/raw/`. Prefix any doc path with `/raw/` (for example [`/raw/api/emails-send.md`](https://fileshub-docs.zaions.com/raw/api/emails-send.md)), or read the [`/raw/manifest.json`](https://fileshub-docs.zaions.com/raw/manifest.json) index to load the whole set into an agent's context.

## Honesty note

The spec is hand-authored from the FilesHub source and kept in sync with it. If you find a mismatch between `/openapi.json` and the live API, the live API is the source of truth — please [open an issue](https://github.com/aoneahsan/files-hub-docs/issues).
