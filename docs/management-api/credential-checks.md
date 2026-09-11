---
sidebar_position: 9
title: Credential checks ("Test Analytics")
description: Send a real "Test Analytics" event to a project's Firebase Analytics, GA4, Amplitude and Sentry — or verify the stored credentials read-only — per project and per tool, from the Management API, with an honest verdict for each.
keywords: [test analytics event, verify amplitude api key, verify sentry dsn, test ga4 measurement id, firebase analytics webconfig, clarity project id check, onesignal app id check, credential check api, analytics credentials test]
last_update:
  date: 2026-09-11
  author: Ahsan Mahmood
---

# Credential checks ("Test Analytics")

A stored credential nobody has used is a credential nobody has verified. A credential check sends a real
**"Test Analytics"** event to each tool a project stores credentials for — or, in verify mode, probes each
one without sending anything — and records one verdict per project × tool.

Available since backend **`2026.09.11.1`**.

## Two modes, two scopes

| Mode | What happens | Scope |
| --- | --- | --- |
| `verify` | Read-only probes. **No event is created anywhere.** Works on any project, a client's included | `can_read_vault` |
| `send` | A real "Test Analytics" event wherever the provider has an API for one | `can_write_vault` |

:::danger `send` only reaches a project that is not a client's and whose switch is ON

Client projects are registered here too, and must never receive a test event. Two independent checks guard
them, in this order, and each answers with its own `409` before anything is sent:

1. **`is_client_project`** marks a client's project and **outranks the switch**. A `send` on one is
   `409 CLIENT_PROJECT`, with `details: {"is_client_project": true}`, whatever `test_events_enabled` says.
   Backend `2026.09.11.3`, deploy pending.
2. **`test_events_enabled`** is **off by default**. A `send` on a project with the switch off is
   `409 TEST_EVENTS_DISABLED`. Turn it on with `PATCH /projects/{project} {"test_events_enabled": true}`.

Both are set on [`PATCH /projects/{project}`](./endpoints.md#patch-projectsproject) and need
`can_write_vault`. A switch turned on by mistake still cannot reach a client's analytics.
:::

## What each tool can actually prove

Each verdict is one of `passed` (the provider acknowledged it, or the credential is proven), `sent`
(delivered, but the provider gives no verdict), `warning`, `failed` or `skipped` (nothing stored, or not
applicable).

| Tool (`service`) | Needs | What a server can prove |
| --- | --- | --- |
| `amplitude` | `amplitude.api_key` | **Everything.** An empty-events request validates the key and ingests nothing; a real send is acknowledged (`events_ingested`). A US key is invalid on the EU endpoint, so the data centre is detected too |
| `sentry` | `sentry.dsn` | **Everything.** The envelope endpoint authenticates the DSN. Verify sends an outcome report, not an event; send creates one event with a fixed fingerprint, so repeated runs stay in **one** issue per project |
| `firebase_analytics` | `firebase.web_api_key`, `firebase.app_id_web` | **The config.** Firebase's own web-config endpoint proves the key and the web app id, and returns the measurement id — compared with the one stored. The event then goes to GA4 |
| `google_analytics` | `google_analytics.measurement_id` | **Nothing.** GA4 answers the same for any id, so the verdict is `sent`; confirm in GA4 → Admin → **DebugView**. The event is `test_analytics` — GA4 rejects spaces in event names |
| `clarity` | `clarity.project_id` | **That the project exists.** Clarity has no server-side event API; the event is recorded from a browser by the Live browser test in the admin panel |
| `onesignal` | `onesignal.app_id` | **The configuration** — the bound web origin and whether Android has an FCM sender. **Never a push**, in either mode |
| `yandex_metrica` | `yandex_metrica.counter_id` | **The format only** — the goal is recorded from a browser |

## Endpoints

### `POST /projects/{project}/credential-checks`

One project, synchronously.

```bash
curl -s -X POST https://fileshub.zaions.com/api/public/v1/projects/my-app/credential-checks \
  -H "Authorization: Bearer $FH_PAT" -H "Content-Type: application/json" \
  -d '{"mode":"send","services":["amplitude","sentry"]}'
```

`services` is optional — absent means every tool. The response carries the run and every result:

```json
{ "data": {
  "run": { "id": "01K…", "mode": "send", "status": "completed",
           "counts": { "passed": 2, "sent": 0, "warnings": 0, "failed": 0, "skipped": 0 } },
  "results": [
    { "service": "amplitude", "status": "passed", "event_sent": true,
      "summary": "Amplitude acknowledged ingestion of \"Test Analytics\" (US data centre)…" },
    { "service": "sentry", "status": "passed", "event_sent": true,
      "summary": "Sentry accepted the \"Test Analytics\" event 3f1c…" } ] } }
```

### `POST /credential-checks`

Many projects, queued — **202** with a run to poll. `projects` is a list of ids, slugs or public ids (at most
100), or `"all_enabled"` for every project whose switch is on, client projects excepted. In `send` mode, a
listed project that is a client's, or has the switch off, is recorded as `skipped` rather than failing the
whole run.

### `GET /credential-checks/{run}` · `GET /credential-checks/{run}/results`

The run's status and counters, and its results — paginated (default 20, max 50) and filterable by
`status`, `service` and `project`. A project-scoped token sees only the runs it started.

## Daily runs

Every project with its switch on receives a "Test Analytics" event **daily at 05:20** (server time). A
client project, or one with the switch off, is never touched.
