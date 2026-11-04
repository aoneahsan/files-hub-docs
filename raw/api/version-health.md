---
sidebar_position: 11
title: Version & health
description: GET /api/health and GET /api/version are FilesHub's public, no-auth status endpoints — health reports database connectivity, version returns the deployed backend build marker.
keywords: [fileshub health, GET /api/health, GET /api/version, backend_version, uptime check, status endpoint]
last_update:
  date: 2026-07-14
  author: Ahsan Mahmood
---

# Version & health

Two public, no-auth endpoints report FilesHub's status. Both live at the API root (`/api`), **not** under `/api/v1`.

## Health

```
GET /api/health
```

No key required. Reports overall status and database connectivity — point an uptime monitor at it.

```json
{
  "status": "ok",
  "app": "files-hub",
  "version": "1.0.0",
  "backend_version": "2026.07.14.3",
  "database": "ok",
  "timestamp": "2026-07-14T10:00:00+00:00"
}
```

`status` is `ok`, or `degraded` with `"database": "error"` when the database is unreachable.

## Version

```
GET /api/version
```

No key required. Returns the deployed backend build marker.

```json
{ "backend_version": "2026.07.14.3", "env": "production" }
```

`backend_version` follows `YYYY.MM.DD.N`. It is a code constant (not an environment variable), so a fresh value confirms a deploy actually shipped the latest code. Use it as a one-request deploy check.

## Notes

- **No authentication** — both endpoints are safe to call from a status page or monitor.
- **`version` vs `backend_version`** — `version` is the product version; `backend_version` is the deploy marker that changes on every deploy-worthy release.
