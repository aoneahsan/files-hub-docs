---
sidebar_position: 1
title: Email marketing overview
description: FilesHub email marketing keeps per-project contact lists, imports contacts by CSV, paste or one at a time, and sends drip sequences that branch on clicks and product events — with consent, suppression and one-click unsubscribe built in.
keywords: [fileshub email marketing, drip sequences, contact lists, csv import, unsubscribe, list-unsubscribe, double opt-in, suppression, email campaigns api]
tags: [email-marketing]
last_update:
  date: 2026-09-29
  author: Ahsan Mahmood
---

# Email marketing overview

**FilesHub email marketing sends campaign email for a project: lists of people, imported with a recorded
reason to write to them, and drip sequences that change course based on what each person did.** It runs on
the same platform that already sends the project's transactional email, from separate marketing mailboxes, so
a campaign can never affect password-reset mail.

## What it does

| Part | What you get |
|---|---|
| **Lists and contacts** | Named lists per project. Each contact keeps its source, the reason it fits, tags and a consent basis. |
| **Three ways in, one pipeline** | CSV upload (with a column-mapping step), pasting comma- or line-separated addresses (`Name <email>` works), or one contact at a time. Every row is checked the same way and lands in exactly one counter. |
| **Consent and suppression** | Every contact records *why* you may write (`opt_in`, `legitimate_interest`, `existing_relationship`). An unsubscribe stops all marketing from that project for good, across every list. |
| **One-click unsubscribe** | Every email carries the RFC 8058 `List-Unsubscribe` headers Gmail and Yahoo require, and a visible unsubscribe link. |
| **Double opt-in** | A public sign-up form confirms by email first; a link scanner cannot confirm for the person. |
| **Sequences** | Emails in tracks (A → B → C), spaced by hours or days, where each step can require "not clicked yet", "signed up", "not activated yet"… and otherwise skip, end, or move the person to another track. |
| **Tracking and events** | Link clicks (scanner clicks filtered out) and events your product reports (`signed_up`, `activated`) steer the sequence immediately. |
| **Designed in FilesHub** | A branded layout — your name, colour and logo, the footer, postal address and unsubscribe line — wraps each email's content. |

## Writing the content — blocks

A template's body is plain, inline-styled HTML. The layout supplies the header, the footer, the unsubscribe
line and a set of **content blocks** that stay readable in every mail client:

| Block | Use it for | On phones |
|---|---|---|
| Hook and one-line summary | What the email is about, and what your product is, in a few words | Unchanged |
| Hero image | One real screen of your product on a lightly tinted panel | Shrinks to 70% width |
| Section heading | Splitting the email so a skimmer reads only the headings | Unchanged |
| Big bullets | The problem or the value: check mark, bold lead phrase, a few words | Unchanged |
| Feature row | An image beside a title and one sentence | Image stacks above the text |
| Callout | The offer or the key promise, in text | Unchanged |

Put the **button above the fold**: straight after the one-line summary, so it shows on a phone without
scrolling. Then give the reader who is hooked the depth: sections, feature rows, how to start, and a
callout. End with the **same button again**. One action, offered twice.

Mark the blocks with the classes the layout reads: `fh-col` and `fh-col-img` on a feature row's two cells,
`fh-hero-img` and `fh-feat-img` on images, and `fh-panel` on a tinted panel (it turns dark in dark mode).
Images must be absolute `https` URLs, ideally public FilesHub objects, under 150 KB each, with alt text that
carries their meaning. The panel tint is your brand colour mixed 8% over white.

## What it does not do

- It never sends to scraped or bought lists: a row without a consent basis is refused.
- It shows **measured numbers only** — sent, failed, unique clicks, unsubscribes, bounces, complaints. There
  is no delivery rate, and opens (off by default) are labelled unreliable because privacy proxies open every
  email.
- No A/B tests, drag-and-drop builder or SMS.

## How sending works

A scheduled job runs every minute and sends the steps that are due, inside the project's sending window and
under its daily cap. Each email leaves from one of the project's **marketing mailboxes** (least-used first)
and never from a transactional one. New mailboxes start at a low daily limit and are raised by hand as the
numbers stay healthy. A project pauses itself automatically when hard bounces pass its threshold or a spam
complaint arrives, until an admin clears the pause.

## Access

| Caller | Credential | Gate |
|---|---|---|
| Your product's backend | `fh_live_` key | `can_manage_email_marketing` on the key (off by default). Server-side only: a request with a browser `Origin` is refused. |
| Your public sign-up form | an origin-restricted `fh_live_` key | the same flag; the only marketing endpoint a browser may call |
| An agent or CLI | `fh_pat_` token | the token's `can_manage_email_marketing` scope; other projects answer 404 |

Next: the [API reference](api.md) and the [product integration recipe](product-integration.md).
