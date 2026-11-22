---
title: Two-step sign-in for people
sidebar_label: Two-step sign-in
description: Turn on two-step sign-in on FilesHub with an authenticator app and ten recovery codes. Remembered browsers, what a recovery code can and cannot do, moving to a new phone, signing out everywhere else, and a support reset.
keywords: [fileshub two-step sign-in, fileshub 2fa, totp authenticator, recovery codes, remembered browser, sign out everywhere, reset two-step]
tags: [other-apps]
last_update:
  date: 2026-11-22
  author: Ahsan Mahmood
---

# Two-step sign-in

**After Google, FilesHub can ask for a 6-digit code from an app on your phone. Someone who has your Google
password still cannot get in, and nobody can show one of your access keys again without that code. It is
optional for people, and you turn it on yourself under Account → Security.**

Two-step sign-in is not behind an admin switch: it works whether or not the [other-app doors](./index.md)
are open.

## Turn it on

It takes about a minute, and you need your phone.

1. Open **Account → Security** and choose **Turn on two-step sign-in**.
2. Scan the code with an authenticator app — Google Authenticator, Microsoft Authenticator, 1Password or any
   other — or type the key into the app.
3. Type the 6-digit code the app shows for FilesHub, and choose **Turn on**.
4. **Save your ten recovery codes.** Copy them or download the `.txt` file. This is the only time FilesHub
   shows them: it keeps only a fingerprint of each one.

FilesHub emails you when two-step sign-in is turned on, and for every change after that.

## What asks for the code

| Moment | With two-step on |
|---|---|
| Signing in | A code after Google, unless this browser is remembered |
| Showing a key or a signing secret again | A code typed in this sign-in, and a sign-in from the last 10 minutes |
| Making or rotating a key or a signing secret | A code typed in this sign-in |
| Approving an assistant | A code, every time |
| Saying yes to a delete | A code, every time |
| Changing two-step itself | A code |

A remembered browser and a recovery code never stand in for the code on the rows below "Signing in".

## Remembered browsers

On the code page you can tick **Skip the code on this browser for 7 days**. Tick it only on a computer
that is yours alone. It is off unless you tick it.

- The browser skips the code at sign-in for 7 days from the day you ticked the box, then asks again.
- Google sign-in is still asked every time.
- Showing a key, approving an assistant, saying yes to a delete and changing two-step always ask for the
  code.

**Account → Security → Remembered browsers** lists each one. **Forget** one, or **Forget every browser**.

## Recovery codes

Each of the ten codes lets you in **once** when your phone is not with you. They look like `k7m2p-9qxdw`;
capitals and the dash do not matter. FilesHub emails you each time one is used.

A recovery code opens your sign-in and **Move to a new phone**, nothing more. It never shows or makes a
key or a signing secret, never makes new codes and never turns two-step off.

**Make new recovery codes** (with your code) replaces all ten. The old ones stop working at once, including
any you have not used. Security tells you when you are running low.

## Five wrong codes

Five codes in a row that do not match make FilesHub stop taking codes for your account for 5 minutes, so
someone guessing cannot get lucky. Nothing is changed. If your codes keep failing, your phone's clock is
usually off: set it to update automatically.

## Move to a new phone

1. Prove it is you with a code from the old phone, or one recovery code (it is used up).
2. Scan the new key with the new phone and type the code it shows.

The old phone's codes stop working when you finish.

## Turn it off

**Turn off two-step sign-in** asks for your code. Sign-in goes back to Google alone, and:

- every browser that skips the code is forgotten;
- your recovery codes stop working;
- your access keys, assistants and webhooks keep working. Showing a key again then needs only a sign-in
  from the last 10 minutes;
- FilesHub emails you that it was turned off, so a change you did not make stands out.

## Where you are signed in

**Account → Security → Sign-ins** shows the last 30 days. If a place there is not you, choose **Sign out
everywhere else** — only the browser you are using stays in — then turn on two-step sign-in.

## Lost the phone and the codes

Write to us from the [contact page](https://fileshub.zaions.com/contact) with the email on your account.
We check it is you before we reset two-step sign-in, so it takes a day or two.

A reset stops your phone and recovery codes and forgets every remembered browser. Your next sign-in sets
two-step up again or carries on without it. Your keys, assistants and webhooks keep working, and you get
an email saying the reset was done. Each reset is recorded with the admin's name and reason. An account
can be reset twice in 30 days; a third needs the owner.
