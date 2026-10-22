---
sidebar_position: 13
title: OpenAPI spec (for AI agents & codegen)
description: FilesHub ships a machine-readable OpenAPI 3.1 spec at /openapi.json covering every API route — feed it to Claude Code, Codex, or an OpenAPI generator to integrate without guesswork.
keywords: [fileshub openapi, openapi 3.1, /openapi.json, ai agent api, codegen, claude code, codex, machine readable api]
last_update:
  date: 2026-10-22
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
- **[Management API](../management-api/overview.md)** — projects, API keys (create, rotate, reveal), per-key origins, global origins, key lookup, and the Supabase project vault.

Two security schemes are declared. The data plane uses `X-API-Key` (an API-key header), with the app-restriction headers (`X-App-Id`, `X-Android-Cert`) as optional parameters on secured operations. The Management API operations use `BearerAuth` (a user-level `fh_pat_` access token) and each carries its own `servers` block pointing at `/api/public/v1`, since it is a different base URL.

Every other API route is in it too — the 40+ stateless [developer utilities](utilities-index), notifications, pastes, short URLs, webhooks, mock APIs, uptime monitors and the newer Management routes. Those operations are generated from the route (marked `x-generated: true`): their request fields come from the validation rules, and their responses are a generic `{data}` object rather than a full schema.

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

The core operations are written by hand from the FilesHub source. Every other route (392 of 392 since 2026-10-22) is added by a generator in the FilesHub repo that reads the route itself — the controller's description, its validation rules, path parameters and auth — and marks it `x-generated: true`; the generator fails while any route is missing. Generated operations describe request fields precisely but answer with a generic `{data}` object; the hand-written ones carry full response schemas. If you find a mismatch between `/openapi.json` and the live API, the live API is the source of truth — please [open an issue](https://github.com/aoneahsan/files-hub-docs/issues).
