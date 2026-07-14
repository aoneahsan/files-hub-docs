---
sidebar_position: 8
title: Email templates
description: Manage reusable email templates in FilesHub — list them, and create, update, or delete them over the API — then send with template + variables.
keywords: [fileshub email templates, email template api, reusable email, template variables, POST /api/v1/emails/templates]
last_update:
  date: 2026-07-14
  author: Ahsan Mahmood
---

# Email templates

**Templates are reusable email bodies with named variables.** Save a template once, then [send](emails-send) it with `template` + `variables` instead of inlining HTML on every call. Templates are shared across your project.

## List templates

```
GET /api/v1/emails/templates
```

**Permission:** `read`. Returns the available templates (slug, name, category, variables).

```bash
curl https://fileshub.zaions.com/api/v1/emails/templates \
  -H "X-API-Key: fh_live_xxx"
```

## Create a template

```
POST /api/v1/emails/templates
```

**Permission:** `write` + `email_template` · **Content-Type:** `application/json`

| Field | Required | Type | Description |
|---|---|---|---|
| `name` | Yes | string (≤255) | Human label. |
| `slug` | No | string (≤255, `alpha_dash`) | Stable id used when sending. Auto-generated from `name` if omitted. **Immutable once set** — unique per install. |
| `category` | Yes | string | One of the server's template categories (e.g. `transactional`, `marketing`). |
| `subject` | Yes | string (≤500) | Subject line; may contain placeholders. |
| `body_html` | One of html/text | string | HTML body with placeholders. |
| `body_text` | One of html/text | string | Plain-text body with placeholders. |
| `description` | No | string (≤2000) | Internal note. |
| `variables` | No | array | Declared placeholders: each `{ name, description?, required? }`. |
| `is_active` | No | boolean | Defaults to active. |

```bash
curl -X POST https://fileshub.zaions.com/api/v1/emails/templates \
  -H "X-API-Key: fh_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Welcome",
    "slug": "welcome",
    "category": "transactional",
    "subject": "Welcome, {{name}}",
    "body_html": "<h1>Hi {{name}}</h1><p>Your {{plan}} plan is ready.</p>",
    "variables": [
      { "name": "name", "required": true },
      { "name": "plan", "required": true }
    ]
  }'
```

## Update a template

```
PATCH /api/v1/emails/templates/{slug}
```

**Permission:** `write` + `email_template`. Send any subset of the create fields except `slug` (immutable). Returns the updated template.

## Delete a template

```
DELETE /api/v1/emails/templates/{slug}
```

**Permission:** `write` + `email_template`. Removes the template. Sends that reference a deleted slug fail validation.

## Sending with a template

```json
{ "to": "user@example.com", "template": "welcome", "variables": { "name": "Sam", "plan": "Pro" } }
```

See [Send an email](emails-send) for the full send contract (domains, queueing, attachments).

## Notes

- **The slug is the contract.** Pick it deliberately; you cannot rename it later — create a new template instead.
- **Placeholders are your responsibility.** Provide every `required` variable when sending, or the send fails validation.
- **Categories are fixed server-side.** Use `GET /emails/templates` (or the admin panel) to see the valid set.
