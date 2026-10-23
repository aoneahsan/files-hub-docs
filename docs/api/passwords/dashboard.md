---
sidebar_position: 5
title: Password manager — using the dashboard
sidebar_label: Using the dashboard
description: Manage FilesHub passwords by hand in the admin dashboard — add a login with a suggested strong password, see the password and current verification code, edit, delete and restore.
keywords: [fileshub passwords dashboard, nova password manager, add password fileshub, verification code dashboard]
last_update:
  date: 2026-10-23
  author: FilesHub team
---

# Using the dashboard

The admin dashboard has the same password manager: **Vault & Credentials → Passwords**. Entries made here
are `admin`-owned, so admin API keys reach them and own keys never do.

**Add a password.** *Create Password* opens a form with Title, Username, Websites (separated by commas), the
Password (a strong one is already filled in; replace it if you have your own), the Verification Code Setup
Key (paste the base32 key or the `otpauth://` link from the site's two-factor screen), Notes, Tags (separated
by commas), Favorite and the Project.

**See a password.** Open the entry. The detail page shows the password and the current verification code with
a copy button. Only the owner account sees these two fields. The list shows each entry's strength, and the
detail page says whether the password is reused in the project.

**Edit.** Leave Password or the setup key empty to keep the current one. A new password moves the old one into
the history (the last 10 are kept; the API returns them on reveal).

**Delete and restore.** Deleting moves an entry to Recently Deleted: choose *With Trashed* or *Only Trashed* in
the list's filter to see it, then *Restore* or *Force Delete*.

**Who made it.** The Ownership panel shows whether an entry is own- or admin-owned, whether it came from the
API or the dashboard, which key created it, and when the password last changed and was last revealed.
