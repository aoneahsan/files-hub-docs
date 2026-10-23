---
sidebar_position: 21
title: Billing — buy a plan by card, and support FilesHub
sidebar_label: Billing and support
description: Buy a FilesHub service plan by card through Polar with POST /api/v1/billing/checkout, how the plan switches on, renews, cancels and ends, and how to support FilesHub once or monthly.
keywords: [fileshub billing api, buy plan api, polar checkout, POST /api/v1/billing/checkout, fileshub subscription, support fileshub]
last_update:
  date: 2026-10-23
  author: FilesHub team
---

# Billing and support

FilesHub takes payments through [Polar](https://polar.sh), which is the merchant of record: Polar's hosted checkout
collects the card, issues the receipt and handles sales tax. FilesHub never sees a card.

:::info Availability
Added in backend **`2026.10.23.6`**; check `GET https://fileshub.zaions.com/api/version`.
:::

## Buy a service plan

Each service has its own monthly price ([pricing](https://fileshub.zaions.com/pricing), machine-readable at
[`/pricing.md`](https://fileshub.zaions.com/pricing.md), whose backticked names are the service keys). A checkout buys
**one service for one project**; buy several services with several checkouts.

### From your code

`POST /api/v1/billing/checkout` with any active API key of the project the plan is for:

```bash
curl -s https://fileshub.zaions.com/api/v1/billing/checkout \
  -H "X-API-Key: $FILESHUB_KEY" -H "Content-Type: application/json" \
  -d '{"service": "files", "email": "billing@acme.test"}'
```

```json
{
  "data": {
    "checkout_url": "https://buy.polar.sh/polar_c_…",
    "service": "files",
    "monthly_price_usd": 5
  }
}
```

| Body field | Meaning |
|---|---|
| `service` | **Required.** A service key from `/pricing.md` that is on sale. |
| `email` | Optional: pre-fills the checkout. |

Send the buyer to `checkout_url`. The key decides the project: a key can only buy for its own project.

| Status | When |
|---|---|
| `201` | `checkout_url` is ready. |
| `401` | No key, or a wrong or disabled key. |
| `422` | `No service plan on sale with that key. See /pricing.md for the keys.` |
| `503` | Polar could not open the checkout; try again in a minute. |

### From the Management API

`POST /api/public/v1/projects/{project}/billing/checkout` with a management token that reaches the project. Same body,
answers `{"data": {"checkout_url", "project", "service", "monthly_price_usd"}}` with `201`; errors use the Management
plane's `{"error": {"code", "message"}}` (`UNKNOWN_SERVICE`, `INVALID_EMAIL`, `CHECKOUT_UNAVAILABLE`).

### What happens after payment

The redirect back from Polar is not what switches the plan on. FilesHub listens to Polar's signed webhooks:

| Polar event | Effect on the project's plan for that service |
|---|---|
| subscription active, updated, renewed, un-cancelled | In force until the end of the period paid for |
| subscription cancelled | Still in force until the end of the period already paid for, then it ends |
| subscription revoked | Ends now |
| payment returned (refund or chargeback) | Ends now: the plan time it paid for is gone |

A plan that is in force removes the `402` for that service. The buyer manages the subscription (card, cancellation,
invoices) from the link in Polar's receipt email.

## Support FilesHub

[fileshub.zaions.com/support](https://fileshub.zaions.com/support): give **once or every month**, $10, $20, $50, $100
or any whole-dollar amount from $1 to $10,000. A contribution buys no service. A monthly contribution is changed or
cancelled from the link in its receipt email.
