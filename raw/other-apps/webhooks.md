---
title: Webhooks — events, signatures and retries
sidebar_label: Webhooks
description: FilesHub sends your server a signed POST when a file is uploaded or deleted, an email is sent or fails, or a service passes 80% of its limit. Sample payloads for every event, Standard Webhooks verification in Node and PHP, retries, pausing and the addresses FilesHub refuses.
keywords: [fileshub webhooks, standard webhooks, whsec, webhook-signature, verify webhook node, verify webhook php, file.uploaded, email.failed, webhook retries]
tags: [other-apps]
last_update:
  date: 2026-11-22
  author: Ahsan Mahmood
---

# Webhooks

**FilesHub tells your server when something happens in your projects: a POST to your `https` address,
signed with your endpoint's secret in the [Standard Webhooks](https://www.standardwebhooks.com) format, and
retried for about a day when your server is down.** You add endpoints on FilesHub under Account → Other
apps → Webhooks; an access key can only see them.

:::info
Webhooks run once an admin has switched on the webhooks door. While it is off, nothing is raised or sent
and no endpoint can be added.
:::

## Add an endpoint

1. Open **Account → Other apps → Webhooks** and choose **Add an endpoint**.
2. Type the **address**: an `https` address on the public internet.
3. Say what it is for (optional) and pick the **events** to send. With two-step sign-in on, adding an
   endpoint asks for your authenticator code, because its secret is shown on screen.
4. Copy the **signing secret**. It starts with `whsec_`, and you can see it again within 10 minutes of any
   sign-in (with your code, when two-step sign-in is on).
5. **Send a test event** and watch it arrive in the delivery log.

Every event goes to every endpoint of yours that asked for it, for each project you belong to.

## The events

| Event | Sent when | `data` |
|---|---|---|
| `file.uploaded` | A file was uploaded | `id`, `name`, `size_bytes`, `project_id` |
| `file.deleted` | A file was deleted | `id`, `name`, `size_bytes`, `project_id` |
| `email.sent` | An email left FilesHub | `id`, `status`, `time`, `project_id` |
| `email.failed` | An email could not be sent | `id`, `status`, `time`, `project_id` |
| `usage.limit_near` | A service passed 80% of its daily request limit | `project_id`, `service`, `used`, `limit` |
| `webhook.test` | You pressed **Send a test event** | `endpoint_id` |

Payloads carry ids, names, sizes and statuses only: never a file's content, never a message body. Fetch
more with an [access key](./api.md) when you need it. Times are UTC.

### `file.uploaded`

```json
{
  "type": "file.uploaded",
  "timestamp": "2026-11-22T09:14:02+00:00",
  "data": {
    "id": "01KAP3W9Q7J2M8R4T6V0X1Y3Z5",
    "name": "receipt-2026-10-31-0042.pdf",
    "size_bytes": 184320,
    "project_id": "01JZ8D2K4M6P8R0T2V4X6Y8A0C"
  }
}
```

### `file.deleted`

Sent for every delete, however it happened: from the dashboard, the data API, or a delete you said yes to.

```json
{
  "type": "file.deleted",
  "timestamp": "2026-11-22T09:21:37+00:00",
  "data": {
    "id": "01KAP3W9Q7J2M8R4T6V0X1Y3Z5",
    "name": "receipt-2026-10-31-0042.pdf",
    "size_bytes": 184320,
    "project_id": "01JZ8D2K4M6P8R0T2V4X6Y8A0C"
  }
}
```

### `email.sent`

```json
{
  "type": "email.sent",
  "timestamp": "2026-11-01T06:00:14+00:00",
  "data": {
    "id": "01KAQ0B8C2D4E6F8G0H2J4K6M8",
    "status": "sent",
    "time": "2026-11-01T06:00:14+00:00",
    "project_id": "01JZ8D2K4M6P8R0T2V4X6Y8A0C"
  }
}
```

### `email.failed`

```json
{
  "type": "email.failed",
  "timestamp": "2026-11-01T06:00:19+00:00",
  "data": {
    "id": "01KAQ0B9N3P5R7T9V1X3Z5B7D9",
    "status": "failed",
    "time": "2026-11-01T06:00:19+00:00",
    "project_id": "01JZ8D2K4M6P8R0T2V4X6Y8A0C"
  }
}
```

The `id` matches the email log's `id` from [`GET /email-log`](./api.md#the-email-log).

### `usage.limit_near`

Sent once per daily window and service, by the request that crosses 80% of the plan's daily request
limit.

```json
{
  "type": "usage.limit_near",
  "timestamp": "2026-11-22T13:40:05+00:00",
  "data": {
    "project_id": "01JZ8D2K4M6P8R0T2V4X6Y8A0C",
    "service": "files",
    "used": 4000,
    "limit": 5000
  }
}
```

### `webhook.test`

```json
{
  "type": "webhook.test",
  "timestamp": "2026-11-22T09:02:11+00:00",
  "data": { "endpoint_id": "ep_m7x2c9rk4tqa" }
}
```

## What a delivery looks like

```http
POST /fileshub HTTP/1.1
Host: hooks.harbourlabs.example
content-type: application/json
user-agent: FilesHub-Webhooks/1.0
webhook-id: msg_p5jXN8AQM2LWnWyQ3b7T1kVd
webhook-timestamp: 1795338842
webhook-signature: v1,0IaU6J2yXAV0eY0piXtsuFyXuevjCgBJsbD0hz5DzDQ=

{"type":"file.uploaded","timestamp":"2026-11-22T09:14:02+00:00","data":{"id":"01KAP3W9Q7J2M8R4T6V0X1Y3Z5","name":"receipt-2026-10-31-0042.pdf","size_bytes":184320,"project_id":"01JZ8D2K4M6P8R0T2V4X6Y8A0C"}}
```

- `webhook-id` stays the same on every retry and on **Send again**. Use it to skip a delivery you already
  handled.
- `webhook-timestamp` is seconds since 1970. Turn away anything more than 5 minutes off your clock.
- `webhook-signature` is `v1,` and the base64 HMAC-SHA256 of `webhook-id.webhook-timestamp.body`, keyed with
  the bytes after `whsec_` (base64-decoded). For 24 hours after you rotate the secret it carries two
  entries, space-separated, one per secret, so your server can switch without missing one.

## Verify a delivery

Check the signature on the **raw body**, before you parse it, and answer `2xx` quickly; do the work after.

### Node, with the Standard Webhooks library

```bash
npm install standardwebhooks
```

```js
import express from 'express';
import { Webhook } from 'standardwebhooks';

const wh = new Webhook(process.env.FILESHUB_WEBHOOK_SECRET); // whsec_…
const app = express();

app.post('/fileshub', express.raw({ type: 'application/json' }), (req, res) => {
  let event;
  try {
    event = wh.verify(req.body.toString('utf8'), req.headers);
  } catch {
    return res.status(400).end();
  }
  res.status(204).end();
  handle(event); // skip it if you have already seen req.headers['webhook-id']
});
```

The library checks the timestamp, every signature entry and the secret's `whsec_` prefix for you.

### Node, without a library

```js
import { createHmac, timingSafeEqual } from 'node:crypto';

/** Checks one FilesHub delivery. Returns the parsed event, or null when it must be refused. */
export function verifyFilesHub(rawBody, headers, secret, now = Math.floor(Date.now() / 1000)) {
  const id = headers['webhook-id'];
  const timestamp = headers['webhook-timestamp'];
  const signatures = headers['webhook-signature'];
  if (!id || !timestamp || !signatures) return null;
  if (Math.abs(now - Number(timestamp)) > 300) return null;

  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${rawBody}`).digest();

  for (const entry of signatures.split(' ')) {
    const [version, value] = entry.split(',');
    if (version !== 'v1' || !value) continue;
    const given = Buffer.from(value, 'base64');
    if (given.length === expected.length && timingSafeEqual(given, expected)) {
      return JSON.parse(rawBody);
    }
  }
  return null;
}
```

### PHP

```php
<?php

/** Checks one FilesHub delivery. Returns the decoded event, or null when it must be refused. */
function verifyFilesHub(string $rawBody, array $headers, string $secret, ?int $now = null): ?array
{
    $id = $headers['webhook-id'] ?? '';
    $timestamp = $headers['webhook-timestamp'] ?? '';
    $signatures = $headers['webhook-signature'] ?? '';
    if ($id === '' || ! ctype_digit($timestamp) || $signatures === '') {
        return null;
    }
    if (abs(($now ?? time()) - (int) $timestamp) > 300) {
        return null;
    }

    $key = base64_decode(substr($secret, strlen('whsec_')), true);
    $expected = base64_encode(hash_hmac('sha256', "{$id}.{$timestamp}.{$rawBody}", $key, true));

    foreach (explode(' ', $signatures) as $entry) {
        [$version, $value] = array_pad(explode(',', $entry, 2), 2, '');
        if ($version === 'v1' && hash_equals($expected, $value)) {
            return json_decode($rawBody, true);
        }
    }

    return null;
}

$event = verifyFilesHub(
    file_get_contents('php://input'),
    [
        'webhook-id' => $_SERVER['HTTP_WEBHOOK_ID'] ?? '',
        'webhook-timestamp' => $_SERVER['HTTP_WEBHOOK_TIMESTAMP'] ?? '',
        'webhook-signature' => $_SERVER['HTTP_WEBHOOK_SIGNATURE'] ?? '',
    ],
    getenv('FILESHUB_WEBHOOK_SECRET'),
);
http_response_code($event === null ? 400 : 204);
```

### Test your code against a known answer

These values were signed with FilesHub's own signer. Your check should accept them when you pass
`1795338842` as the current time, and refuse them if you change one character of the body:

| | Value |
|---|---|
| Secret | `whsec_MfKQ9r8GKYqrTOaW0uJ1hNP4F2rVqZbJcSj7pQk6c3Q=` |
| `webhook-id` | `msg_p5jXN8AQM2LWnWyQ3b7T1kVd` |
| `webhook-timestamp` | `1795338842` |
| Body | The one-line body in [What a delivery looks like](#what-a-delivery-looks-like) |
| `webhook-signature` | `v1,0IaU6J2yXAV0eY0piXtsuFyXuevjCgBJsbD0hz5DzDQ=` |

The secret is an example made for this page. It belongs to no endpoint.

## Retries

Any `2xx` counts as delivered. Anything else, no answer within 10 seconds, or a redirect counts as a
failed try, and FilesHub tries again after 5 seconds, 5 minutes, 30 minutes, then 2, 5, 10 and 10 hours:
eight tries in all.

FilesHub **turns the endpoint off** and emails you when:

- the last try fails,
- it has been failing for 5 days in a row, or
- your server answers `410 Gone` — at once, with no more tries.

**Turn back on** brings it back. FilesHub reads at most the first 4 KB of your server's answer for the
delivery log and never keeps its headers.

## Pause, send again, the log

- **Pause** keeps the events and sends nothing. Each one shows in the log as "Not sent: endpoint paused".
- **Turn back on** sends new events from then on. Anything held while paused can be sent from the log
  with **Send again**.
- **Send again** re-sends one delivery with the same `webhook-id`.
- The **delivery log** shows the last 30 days: event, when, which try, your server's answer and when the
  next try is due.
- **Rotate secret** needs a sign-in from the last 10 minutes (and your code, when two-step sign-in is on),
  so the new secret can be shown to you. Both secrets sign for 24 hours.
- **Delete endpoint** stops everything to it at once.

## Addresses FilesHub refuses

FilesHub checks the address when you add it and again right before every delivery, and then connects to
exactly the address it checked. It refuses:

- anything but `https://`, and a name or password in the address;
- a port other than 443 or 8443;
- an address that points back at the server itself, or is written as a number (`2130706433`, `0x7f.1`);
- private, reserved, link-local and shared addresses, cloud metadata services included, in IPv4 and IPv6;
- names that work only inside a network, like `.local`, `.internal`, `.lan` or a name with no dot;
- a name that resolves to any of those, even if only one of its answers does;
- FilesHub's own servers;
- an address longer than 2,048 characters.

A refused address is a failed try at delivery time, and nothing is read from it.

## Limits

Your plan sets how many endpoints you can have; see [Limits](./index.md#limits).
