---
sidebar_position: 8
title: Payment accounts
description: Keep the API keys, webhook secrets and login details of your payment-provider accounts (Stripe, PayPal, Polar.sh, Creem, Lemon Squeezy, Paddle and more) on one record, and read them back over the FilesHub Management API.
keywords: [stripe key storage, payment provider api keys, paypal client secret storage, polar.sh access token, lemon squeezy api key, paddle api key, creem api key, webhook secret vault, can_read_payment_accounts, payment credentials vault]
last_update:
  date: 2026-09-30
  author: Ahsan Mahmood
---

# Payment accounts

A payment provider's secret key moves money and issues refunds. It belongs to an *account*, often shared by
several products, so it gets its own record, like the [developer accounts](./developer-accounts.md) do.

Available since backend **`2026.09.30.3`**.

## What it holds

Twenty-two providers ship declared. `GET /payment-accounts/providers` returns the live list, so call it
instead of relying on this table.

| Kind | Providers |
|---|---|
| Card processors and gateways | `stripe`, `paypal`, `braintree`, `square`, `adyen`, `mollie`, `checkout_com`, `authorize_net`, `razorpay`, `paystack`, `flutterwave` |
| Merchants of record | `polar`, `creem`, `lemon_squeezy`, `paddle`, `dodo_payments`, `fastspring`, `two_checkout`, `gumroad` |
| Pakistan | `jazzcash`, `easypaisa` |
| Anything else | `other` (name the provider in its own field) |

Each provider declares its own fields: live and test/sandbox keys, webhook signing secrets, account and
merchant ids. Every provider also takes a **business name**, the **dashboard login password** and the
**2FA recovery codes**.

- **Only the account email is required.** Every other field is optional, so you can save what you have.
- Secrets are encrypted per field. Identifiers such as account ids, publishable keys and client ids are not
  secret, so they come back on an ordinary read.

Records are entered in the dashboard: **Nova → Payment Accounts**. When you pick a provider, the credential
fields change to that provider's.

## Endpoints

All of these are **read-only**. Every route except `providers` needs the `can_read_payment_accounts` scope,
which is off by default. **No other scope grants it**, including `can_reveal_vault`.

| Method | Path | Returns |
|---|---|---|
| `GET` | `/payment-accounts/providers` | The provider registry: fields, which are secret, the env var each maps to. Any valid token |
| `GET` | `/payment-accounts` | A page of accounts. Filters: `q`, `provider`, `email`, `active` |
| `GET` | `/payment-accounts/{account}` | One account: `identifiers` (non-secret values) and `has.*` presence flags, never a secret |
| `POST` | `/payment-accounts/{account}/reveal` | Every stored value plus an `env.node` block. Always audited, with field names only. `409` when nothing is stored |
| `GET` | `/projects/{project}/payment-accounts` | Which accounts a project sells through (attached in the dashboard). Pointers only |

`{account}` is the numeric id or `provider:email`, for example `stripe:billing@example.com`. A bare email is
refused because one login often owns accounts at several providers.

```bash
curl -s -X POST https://fileshub.zaions.com/api/public/v1/payment-accounts/stripe:billing@example.com/reveal \
  -H "Authorization: Bearer $FILESHUB_PAT"
```

```json
{
  "data": {
    "id": 3,
    "provider": "stripe",
    "account_email": "billing@example.com",
    "identifiers": { "publishable_key_live": "pk_live_…" },
    "has": { "secret_key_live": true, "webhook_secret_live": false, "…": false },
    "credentials": { "publishable_key_live": "pk_live_…", "secret_key_live": "sk_live_…" },
    "env": { "node": "STRIPE_PUBLISHABLE_KEY=pk_live_…\nSTRIPE_SECRET_KEY=sk_live_…" }
  }
}
```

:::warning Server-side only
The reveal emits an `env.node` block and never a `VITE_` or `NEXT_PUBLIC_` one. A browser needs only a
publishable key, and that already comes back in `identifiers` on an ordinary read.
:::
