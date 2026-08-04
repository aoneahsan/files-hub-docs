---
sidebar_position: 7
title: Pagination
description: Every FilesHub list endpoint is paginated the same way — 20 rows by default, 50 maximum — and every response states its page, its total, how much remains, and the exact call to make next.
keywords: [fileshub pagination, per_page, page, meta, remaining_items, next_page, list endpoints, api paging]
last_update:
  date: 2026-08-04
  author: Ahsan Mahmood
---

# Pagination

**Every paginated list on both API planes paginates identically** — same parameters, same ceiling, same
`meta`. No endpoint returns an unbounded result set, and none has a different page-size ceiling.

| | |
|---|---|
| Default page size | **20** rows |
| Maximum page size | **50** rows |
| Parameters | `?page=` (1-based) and `?per_page=` |
| Style | Offset — so a page number and a total are always available |

## Three endpoints return a plain array

A set that is **structurally bounded** — an operator types the rows by hand and there will never be many —
is returned whole, with no `meta` and no `message`:

| Endpoint | Why it is bounded |
|---|---|
| `GET /api/public/v1/projects/{project}/api-keys/{apiKey}/origins` | Origins are entered per key; a few dozen at most |
| `GET /api/public/v1/global-origins` | Platform-wide rules an administrator maintains; a handful |
| `GET /api/public/v1/vault/services` | The field registry — a fixed schema, currently 18 services |

`POST /global-origins/check` likewise answers with a bare array of verdicts, one per candidate, capped at the
50 candidates you may submit.

Everything else — including `GET .../api-keys` itself, which grows without limit because rotated and deleted
keys leave their rows behind — is paginated as below. **Check for `meta` rather than assuming either shape.**

:::tip A larger `per_page` is clamped, never rejected
Sending `per_page=1000` returns **50** rows with a `200`, and `message` tells you it was capped. Your
existing call keeps working; it just gets fewer rows per round trip. You will never get a `422` for
asking for too many.
:::

## Every paginated response carries `meta` and `message`

```json
{
  "data": [ /* … up to 50 rows … */ ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 137,
    "last_page": 7,
    "from": 1,
    "to": 20,
    "count": 20,
    "has_more": true,
    "remaining_items": 117,
    "remaining_pages": 6,
    "next_page": 2,
    "prev_page": null,
    "max_per_page": 50,
    "default_per_page": 20
  },
  "message": "Showing 1-20 of 137 (page 1 of 7). 117 more available - request page 2 to continue (?page=2&per_page=20)."
}
```

All **14** keys are always present. `from` and `to` are `null` on an empty page; `next_page` and `prev_page`
are `null` at the ends.

The v1 data plane adds `"success": true` alongside these; the Management plane does not. That is the only
difference between the two.

### What each field is for

| Field | Use it to |
|---|---|
| `has_more` | Decide whether to loop at all — a single boolean, no arithmetic |
| `next_page` | Fetch the next page. `null` means you are done |
| `remaining_items` | Show real progress, or size the remaining work before starting |
| `remaining_pages` | Know how many more round trips are left |
| `total` | Display a count without fetching everything |
| `max_per_page` | Discover the ceiling at runtime instead of hard-coding 50 |

`message` restates all of it in one sentence. It exists so a consumer that ignores `meta` still notices it
only holds part of the set, and so a truncated response is never mistaken for missing data.

## Reading every page

```bash
page=1
while : ; do
  body=$(curl -s -H "X-API-Key: $KEY" "https://fileshub.zaions.com/api/v1/emails?page=$page&per_page=50")
  echo "$body" | jq -c '.data[]'
  [ "$(echo "$body" | jq -r '.meta.has_more')" = "true" ] || break
  page=$(echo "$body" | jq -r '.meta.next_page')
done
```

```js
async function* allPages(path, key) {
  let page = 1;
  for (;;) {
    const res = await fetch(`https://fileshub.zaions.com${path}?page=${page}&per_page=50`, {
      headers: { 'X-API-Key': key },
    });
    const body = await res.json();
    yield* body.data;
    if (!body.meta.has_more) return;
    page = body.meta.next_page;
  }
}
```

:::warning Do not assume one call returned everything
A response with exactly 50 rows is far more likely to be a full first page than a complete set. Check
`has_more`, never `data.length`.
:::

## Why offset and not cursor

Cursor pagination walks a keyset. It is excellent at scale, and it **cannot tell you which page you are on
or how many rows exist** — it has no idea what lies beyond the row it is holding, and producing a total
would require exactly the `COUNT(*)` that cursor pagination exists to avoid.

Because these endpoints are consumed heavily by automated clients that need to report progress and size
their work up front, FilesHub uses offset pagination and always returns a real `total`. If a single
endpoint ever outgrows that, cursor support will be added to that endpoint alone rather than changing this
contract everywhere.

## History

Before **2026-07-31** this was inconsistent: six endpoints returned every matching row with no limit at
all, ten capped at 100, and one defaulted to 50 — and nothing in a response indicated which kind you were
talking to. If you have a client that passed `per_page=100`, or that assumed one call returned everything,
it now receives at most 50 rows per page and a `message` saying so. Loop on `has_more` and it is correct
again.
