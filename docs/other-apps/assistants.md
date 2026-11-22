---
title: Connect an AI assistant (MCP at /mcp/account)
sidebar_label: Assistants
description: Add FilesHub to Claude, ChatGPT, Claude Code or Cursor with one address, https://fileshub.zaions.com/mcp/account. You approve each assistant on FilesHub, pick its projects and what it may do, and every delete it asks for waits for your yes.
keywords: [fileshub mcp, mcp account, claude connector fileshub, chatgpt connector, claude code mcp, cursor mcp, oauth pkce, dynamic client registration]
tags: [other-apps]
last_update:
  date: 2026-11-22
  author: Ahsan Mahmood
---

# Connect an AI assistant

**Add FilesHub to Claude, ChatGPT, Claude Code or Cursor with one address:
`https://fileshub.zaions.com/mcp/account`. The assistant opens a FilesHub page where you read what it
asks for, untick anything it does not need, pick its projects and approve. Nothing reaches your account
until you do.**

:::info
The address answers once an admin has switched on the assistants door. While it is off, the address and its
sign-in answer `404`, and the Assistants tab on Other apps says the door is not open yet.
:::

## Claude

1. In Claude, open **Settings → Connectors** and choose **Add custom connector**.
2. Name it FilesHub and paste `https://fileshub.zaions.com/mcp/account`. Leave the OAuth fields empty:
   Claude registers itself.
3. Claude opens FilesHub. Read what it asks for, untick anything it does not need, then approve.

## ChatGPT

1. In ChatGPT, open **Settings → Apps & Connectors → Create**, with developer mode on if your plan asks for
   it.
2. Paste `https://fileshub.zaions.com/mcp/account` and choose **OAuth** as the sign-in. Never "No
   authentication".
3. ChatGPT opens FilesHub. Read the request, choose what it may do, then approve.

## Claude Code

Run this in a terminal:

```bash
claude mcp add --transport http fileshub https://fileshub.zaions.com/mcp/account
```

Start Claude Code, type `/mcp`, then choose **fileshub → Authenticate**. Your browser opens FilesHub; read
the request and approve it there.

## Cursor

In Cursor, open **Settings → MCP → Add new MCP server**, paste this into `mcp.json` and save:

```json
{
  "mcpServers": {
    "fileshub": {
      "url": "https://fileshub.zaions.com/mcp/account"
    }
  }
}
```

Cursor opens FilesHub for you to read and approve the request.

## The approval page

The page names the app, the address it will send you back to, and how it registered. You choose:

- **Call it** — the name in your list of assistants, like "Claude on my laptop". Only you see it.
- **Projects it can see** — none is picked for you when you have more than one.
- **What it may do** — the "see" scopes it asked for are ticked; untick any it does not need. Deleting is
  never ticked for you.

Approving asks for a code from your authenticator every time when [two-step sign-in](./two-step-sign-in.md)
is on, even on a browser that usually skips the code. With two-step off, approving needs a Google sign-in
from the last 10 minutes. FilesHub emails you about every new connection.

If the request does not match what the app registered — the address it sends you back to, its PKCE proof,
or the server it asked for — FilesHub stops it before showing you anything, and nothing is shared.

## What an assistant can do

| Tool | Scope | Does |
|---|---|---|
| `get_account` | `account:read` | Your name, email and the plans on your projects |
| `list_projects` | `projects:read` | The projects this connection can see, with your role and the services each uses |
| `list_files` | `files:read` | Files in one project, newest first. Never a file's content. Takes `project_id`, optional `cursor` |
| `get_file` | `files:read` | One file's details. Takes `file_id` |
| `make_download_link` | `files:read` | A link that downloads one file for 5 minutes. Takes `file_id` |
| `get_usage` | `usage:read` | This month's files, storage and emails per project, today's requests, your other-app limits |
| `list_email_log` | `email_log:read` | To, subject, status and time. Never a message body. Optional `project_id`, `cursor` |
| `prepare_delete_file` | `files:delete` | Asks you to delete one file. Takes `file_id` |
| `get_delete_request` | `files:delete` | Whether a delete it asked for was confirmed, kept, ended or cancelled. Takes `request_id` |

A list returns at most 50 items a call. Results come back as structured content with the same fields as
the [API](./api.md); text in names and subjects is your own content, returned as data.

## Deletes come back to you

`prepare_delete_file` deletes nothing. FilesHub emails you, and the Assistants tab shows **Waiting for
your yes** with the file, the project and which assistant asked. Open it, check it is the file you meant,
and press **Yes, delete it** or **No, keep it**. An unanswered request ends after 10 minutes.

If you did not ask the assistant for this, press No and look at what it was reading. A sentence hidden in a
document can tell an assistant to do things. That is why a delete always comes back to you, and why an
assistant never sees anything on the [never-reachable list](./index.md#never-reachable-through-any-door).

## What stays off unless you choose it

- **Deleting.** Never ticked for you, and every delete waits for your yes with your code.
- **Uploading and renaming.** Assistants can see files; they cannot upload or rename them.
- **Every project at once.** You pick the projects on the approval page.
- **Keys, webhooks and two-step.** No assistant can make a key, add an endpoint or change Security.
- **Staying connected forever.** An assistant's access lasts 10 minutes at a time and renews only while it
  stays on your list.

## Rename or disconnect

On **Account → Other apps → Assistants** each connection shows where it signs in from, its projects, when
it connected and its last call. **Disconnect** stops the very next call, not only the next sign-in, and
cancels any delete it asked for that is still waiting. An admin can also disconnect a person's assistant.

Your plan sets how many assistants you can connect at once; see [Limits](./index.md#limits).

## For client builders

`/mcp/account` is a Streamable HTTP MCP server (POST only) with its own OAuth 2.1 server:

| | |
|---|---|
| Protected-resource metadata | `https://fileshub.zaions.com/.well-known/oauth-protected-resource/mcp/account` |
| Authorization-server metadata | `https://fileshub.zaions.com/.well-known/oauth-authorization-server/mcp/account` |
| Issuer and resource | `https://fileshub.zaions.com/mcp/account` |
| Registration | `POST /mcp/account/oauth/register` (RFC 7591, public clients) |
| Authorize · token | `/mcp/account/oauth/authorize` · `/mcp/account/oauth/token` |
| Grants | `authorization_code` with PKCE `S256` only, `refresh_token` |
| Redirect addresses | `https`, or `http` on `localhost`, `127.0.0.1` or `::1` |
| Tokens | 10-minute access tokens, 30-day refresh tokens that work once |

Reusing a spent code or refresh token revokes the whole connection. An unauthenticated call answers `401`
with `WWW-Authenticate: Bearer resource_metadata="…"`.

This server is separate from the vault MCP at `/mcp` that admins use: a person's token is never valid
there, and an admin's vault token is never valid here.
