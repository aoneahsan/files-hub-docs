---
title: Other apps — your FilesHub projects in your own tools
sidebar_label: Overview
description: People who belong to FilesHub projects can connect their own scripts with fh_usr_ access keys, AI assistants over MCP, and servers with signed webhooks. What each door reaches, what it never reaches, and who switches it on.
keywords: [fileshub other apps, fh_usr_ access key, fileshub mcp, fileshub webhooks, fileshub person api, project member, two-step sign-in]
tags: [other-apps]
slug: /other-apps
last_update:
  date: 2026-11-22
  author: Ahsan Mahmood
---

# Other apps

**If you belong to a FilesHub project, you can let your own scripts, an AI assistant or another server work
with that project's files, usage and email log. You set this up yourself on FilesHub, under Account → Other
apps, and you can see exactly what each connection reaches.**

There are three ways in. FilesHub calls them doors:

| Door | For | Page |
|---|---|---|
| **Access keys** | A script or server of yours, sending `fh_usr_` keys | [Access keys](./access-keys.md) · [The API](./api.md) |
| **Assistants** | Claude, ChatGPT, Claude Code, Cursor | [Assistants](./assistants.md) |
| **Webhooks** | Your server, told when something happens | [Webhooks](./webhooks.md) |

:::info An admin switches each door on
Each door has its own switch in FilesHub's admin panel, and all three start off. While a door is off,
everything behind it answers `404`, nothing can be made on its tab, and Other apps says so on that tab.
[Two-step sign-in](./two-step-sign-in.md) is not behind a switch.
:::

## Who this is for

A **person** here is someone whose request for dashboard access was approved. The approval makes them a
**member** of named projects, with one of two roles in each:

| Role | Can see | Can ask to delete a file |
|---|---|---|
| **Viewer** | Yes | No — a delete asked for in this project is refused |
| **Operator** | Yes | Yes — and the delete still waits for their yes on FilesHub |

People sign in with Google only. After approval, signing in takes you straight to Other apps.

Admins are not people in this sense. Their keys and assistants are the
[Management API](../management-api/overview.md) and the vault's own MCP server, which stay exactly as they
are.

## What each door reaches

Only your own projects, and only what you could already see or do on FilesHub yourself. A key or an
assistant reaches no more than it was given when you made it.

| What | Detail | Access key | Assistant | Webhook events |
|---|---|---|---|---|
| Your account | Name, email, plan | See | See | None |
| Projects you belong to | Name, services used, created | See | See | None |
| Files | Name, size, type, uploaded, public or private | See. Delete waits for your yes | See. Delete waits for your yes | Uploaded, deleted: id, name, size, project. Never the file |
| Download links | One file, 5 minutes | Make | Make | None |
| Usage and limits | This month, per service | See | See | Past 80% of a limit |
| Email log | To, subject, status, time | See. Never the message | See. Never the message | Sent, failed: id, status, time |
| Your webhooks | Endpoints and deliveries | See. Change them only on FilesHub | No | The test event |
| Keys, assistants, two-step | Other apps and Security | No | No | None |

Uploading and renaming come to keys once your project's Files page on FilesHub has those buttons. Until
then a key can see files and ask to delete one.

**Why no message bodies:** a sent email holds other people's details and often a one-time link, such as a
password reset. The log says it went; the message stays with the person it was for.

## Never reachable, through any door

Not with any key, any assistant or any webhook, whatever it was given:

- vault values, vault files and `.env` blocks of any project;
- revealing any credential, API key or Supabase secret;
- any `fh_live_` project key or `fh_pat_` management token;
- Password Manager entries;
- AI account keys and AI credit;
- Developer Accounts: npm, store and hosting tokens;
- Payment Accounts and payouts;
- Supabase account tokens and project secrets;
- database backups;
- email message bodies, attachments and email-marketing lists;
- other people's projects, files and logs;
- Nova, plans, payments and two-step settings.

Anything outside your projects answers `404`, never `403`, so a key cannot learn what exists.

## An access key is not a management token

FilesHub already has management tokens (`fh_pat_`), which the owner makes in Nova to run projects, keys
and vaults, and project API keys (`fh_live_`) for the [data API](../api/overview.md). Both stay exactly as
they are. An access key is a separate, narrower thing for one person's own projects:

| | Access key | Management token |
|---|---|---|
| Starts with | `fh_usr_` | `fh_pat_` |
| Made by | You, on Other apps | The owner, in Nova |
| Reaches | Your projects' files, usage, email log | Projects, API keys, origins, vaults, backups, by scope |
| Shows a secret | Never | With its reveal scopes |
| Expires | 30, 90 or 365 days; "never" for see-only keys | As the owner set it |
| Seen again | Within 10 minutes of a sign-in, with your code | Unchanged |
| Docs | [Access keys](./access-keys.md) | [Management API](../management-api/overview.md) |

Neither works in the other's place. The person API answers an `fh_pat_` or `fh_live_` value with
`401 wrong_credential`, and the management and vault routes accept only their own prefixes, so an
`fh_usr_` key gets nowhere there.

## Limits

Four limits apply to each person: access keys, API requests a day, webhook endpoints and connected
assistants. They come from the service plans in force on your projects, and **the highest one counts**.
When none of your projects has a plan in force, the base limits an admin sets for people apply. The
**Plan use** tab on Other apps shows what you have used and what you are allowed.

Lowering a limit never deletes anything: if you are over it, you keep what you have and cannot add more.
API requests start again at midnight GMT+5.

## Emails FilesHub sends you

FilesHub emails you when a key is made, seven days before a key ends, when an assistant connects, when
something asks to delete a file, when a webhook endpoint is turned off for failing, and when anything about
your two-step sign-in changes. A key or secret is never in an email.
