---
sidebar_position: 3
title: Connect your product to email marketing
description: The recipe every product follows to connect FilesHub email marketing — carry the ?c= contact token through sign-up, report signed_up and activated events from the server, and add a double opt-in form.
keywords: [contact token, signed_up event, activated event, email marketing integration, double opt-in form, utm alternative, fileshub events api]
tags: [email-marketing, guides]
last_update:
  date: 2026-09-29
  author: Ahsan Mahmood
---

# Connect your product to email marketing

**FilesHub can see clicks; only your product knows who signed up and who started using it.** Three small
pieces connect the two, and they are the same for every product.

## 1. Keep the contact token through sign-up

Every tracked link to **your own site** (your key's registered origins, plus any host in the list's
`token_hosts`) arrives with `?c=<contact_token>`. Links to other sites never get it.

1. On landing, read `c` from the URL and store it the way you store a referral code (local storage via your
   storage layer, or a cookie), for about 30 days.
2. Keep it through sign-up, and save it on the new account.

## 2. Report events from your server

When the account's email is verified, and again when the person first uses the product for real, call
FilesHub **from your backend** (never the browser — this endpoint refuses a browser `Origin`):

```bash
curl -X POST https://fileshub.zaions.com/api/v1/email-contacts/events \
  -H "X-API-Key: $FILESHUB_MARKETING_KEY" -H "Content-Type: application/json" \
  -d '{"contact_token":"<c from step 1>","event":"signed_up"}'
```

Then `"event": "activated"` when your own activation trigger fires. Sending twice is safe (the second call
answers `duplicate: true`). No token? Send `{"email": "...", "list": "<list id>", "event": "signed_up"}`.

What happens next is up to the sequence: a `no_event signed_up` condition stops the "create your account"
emails for that person at once, and an `exit_events: ["activated"]` ends their sequence.

## 3. Optional: a sign-up form with double opt-in

1. Create a **transactional** template containing `{{confirm_url}}` (and `{{first_name}}`, `{{list_name}}`
   if you like), and set it as the list's `confirmation_template`.
2. From the browser, post to `POST /api/v1/email-lists/{list}/subscribe` with an origin-restricted key and a
   Turnstile token. Show the same "check your inbox" message whatever the answer.
3. The person confirms on FilesHub's page; only then do they become an active contact (and join any sequence
   with `auto_enroll_new_contacts`).

## Keys you need

| Key | Where it lives | Flags |
|---|---|---|
| Server key | your backend's secret store | `can_manage_email_marketing` · not origin-restricted, or `allow_no_origin` |
| Form key (only for step 3) | the browser bundle | `can_manage_email_marketing` · **restricted** to your site's origin |
