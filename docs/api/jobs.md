---
sidebar_position: 10
title: Job status
description: Poll GET /api/v1/jobs/{job_id} to track a queued FilesHub operation (like a queued email send) through queued → completed or failed, with attempts and result.
keywords: [fileshub jobs api, job status, queued job polling, GET /api/v1/jobs, async email status, job_id]
last_update:
  date: 2026-07-14
  author: Ahsan Mahmood
---

# Job status

**When you queue an operation — like a [queued email send](emails-send) — FilesHub returns a `job_id`.** Poll the job to see when it finishes and whether it succeeded. Jobs are scoped to your project.

## Get one job

```
GET /api/v1/jobs/{job_id}
```

**Permission:** `read`. `{job_id}` is the ULID returned by the operation that created the job.

```bash
curl https://fileshub.zaions.com/api/v1/jobs/01JJOBXXXXXXXXXXXXXXXXXXXX \
  -H "X-API-Key: fh_live_xxx"
```

### `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "01JJOBXXXXXXXXXXXXXXXXXXXX",
    "type": "email.send",
    "status": "completed",
    "attempts": 1,
    "result": { "email_id": "01JEMAILLOGXXXXXXXXXXXXXXX" },
    "error": null,
    "queued_at": "2026-07-14T10:00:00+00:00",
    "started_at": "2026-07-14T10:00:12+00:00",
    "finished_at": "2026-07-14T10:00:13+00:00"
  }
}
```

`status` moves `pending` → `processing` → `completed` or `failed`. On failure, `error` carries the reason and `attempts` reflects the retries (queued email retries three times with backoff). A missing/foreign id returns `404`.

## List jobs

```
GET /api/v1/jobs
```

**Permission:** `read`. Paginated (default 20, max 50 per page). Optional filters: `status`, `type`, `page`, `per_page`.

```bash
curl "https://fileshub.zaions.com/api/v1/jobs?status=failed&per_page=50" \
  -H "X-API-Key: fh_live_xxx"
```

```json
{
  "success": true,
  "data": [ { "id": "01J...", "type": "email.send", "status": "failed", "attempts": 3, "error": "..." } ],
  "meta": { "current_page": 1, "last_page": 1, "per_page": 50, "total": 1 }
}
```

## Notes

- **Poll, don't hammer.** Queued email typically completes within about a minute; poll every few seconds, not in a tight loop.
- **Project-scoped.** A job created by one project's key is not visible to another.
- **You can also read the email log** at `GET /api/v1/emails/{id}` for the delivery record of a specific send.
