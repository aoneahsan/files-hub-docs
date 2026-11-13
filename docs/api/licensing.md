---
sidebar_position: 22
title: Licensing — white-label licences, buyouts and verification
sidebar_label: Licensing
description: The public licensing API behind every product's white-label pages — catalogue, quote, Polar checkout on the product's own organization, renewals, requests, and licence verification by key or by domain.
keywords: [fileshub licensing api, white-label licence api, license verification api, source buyout, polar checkout, /api/licensing/v1]
last_update:
  date: 2026-11-13
  author: FilesHub team
---

# Licensing

Our products can be bought as a **white-label licence** (we run the product under the buyer's name, on their
domain) or as a **source buyout** (the buyer receives the code, and the product is no longer sold). FilesHub
holds the catalogue, computes every price, opens the checkout, issues the licence keys and answers every
verification, so no product keeps a licence backend of its own.

:::info Availability
Added in backend **`2026.11.13.1`**; check `GET https://fileshub.zaions.com/api/version`.
:::

Base URL `https://fileshub.zaions.com/api/licensing/v1`. **No API key**: product pages, docs sites and
buyers' own hosts call these routes, and CORS is open. A product is named by its FilesHub slug. Every route
is throttled per IP.

Responses use one envelope: success `{"data": …}`; failure `{"error": "machine_code", "message": "…"}`
(validation failures add `errors`).

## Catalogue and price

| Route | What it answers |
|---|---|
| `GET /products/{slug}/catalog` | The groups on offer with their prices, the bundle discount, the buyout, the update plans, `sales_state` and `checkout_available` |
| `POST /products/{slug}/quote` | The total for `{"kind": "white_label", "groups": [...]}`, `{"kind": "buyout"}` or `{"kind": "renewal", "months": 6}` |

`sales_state` is `on_sale` (online checkout), `quote_only` (send a request) or `acquired` (bought out; no new
licences). A product's pages read the catalogue at build time and again on load, and never compute a total
themselves.

```bash
curl -s -X POST https://fileshub.zaions.com/api/licensing/v1/products/clearhire/quote \
  -H 'Content-Type: application/json' -d '{"kind":"white_label","groups":["web","mobile"]}'
# {"data":{"kind":"white_label","groups":["web","mobile"],"subtotal_usd":20000,"discount_pct":10,
#          "discount_usd":2000,"total_usd":18000,"updates_months":6,"months":null}}
```

## Buying

| Route | Body |
|---|---|
| `POST /products/{slug}/checkout` | `kind` (`white_label` or `buyout`), `groups`, `buyer` {`name`, `email`, `company`, `domain`, `country`}, `notes`, `turnstile_token`, `success_path`, `cancel_path` |
| `POST /products/{slug}/renewals` | `public_key`, `email` (the one on the licence), `months`, `turnstile_token` |
| `POST /products/{slug}/inquiries` | `kind` (`quote`, `custom_work`, `buyout_call`), `name`, `email`, `company`, `groups`, `message`, `turnstile_token` |
| `GET /orders/{order_id}` | One read on the thank-you page: `status` and, once paid, the licence key |

The checkout opens on **the product's own Polar organization** with the total FilesHub computed, and answers
`{"data": {"checkout_url": "…"}}`; the page sends the buyer there in the same tab. Paths are joined to the
product's own site. Nothing is granted by the redirect: the licence is issued when Polar's signed `order.paid`
arrives and its amount matches the order, and FilesHub then emails the buyer their certificate.

`turnstile_token` is required when the product has a Turnstile secret in its FilesHub vault.

## Verifying a licence

| Route | Answers |
|---|---|
| `GET /licenses/verify?key=KEY` | `verdict`: `valid`, `pending_setup`, `revoked`, `not_found` or `invalid_format`, with the public fields of the licence |
| `GET /licenses/verify?key=KEY&host=HOST` | The same, plus `host_authorized` — the check a white-label build runs once on start |
| `GET /licenses/verify?domain=HOST&product=SLUG` | FilesHub reads `https://HOST/.well-known/{prefix}-white-label-license.json` and checks the key it names: `authorized`, `domain_mismatch`, `revoked`, `not_a_valid_license`, `no_file` or `unreachable` |
| `GET /licenses/{key}/certificate.pdf` | The public certificate |

Verification answers never carry an email, a price or the private key. A licence covers each recorded domain
and its subdomains.

## Management API

Agents set a product's offer with an `fh_pat_` token: `GET|PUT /api/public/v1/projects/{project}/license-offer`
(writes need **Can Write Vault**), `GET /api/public/v1/projects/{project}/licenses`, and
`POST /api/public/v1/projects/{project}/licenses/import` for licences issued before FilesHub held them
(idempotent on `public_key`). See the [OpenAPI document](./openapi.md).
