# Deploying the FilesHub docs site

This PUBLIC docs site is published on **GitHub Pages** at **`fileshub-docs.zaions.com`**. It is
free and auto-deploys on every push to `main`.

> These are **human-only** steps (they need repo settings or DNS access). An agent prepares the
> config and content; you enable Pages and add the DNS record once. This file is referenced from
> `files-hub/docs/MANUAL-TASKS.md`.

## Prerequisites

- Node ≥ 18, yarn (classic). `yarn install` then `yarn build` must produce `./build`.
- Custom domain **`fileshub-docs.zaions.com`**, carried by `static/CNAME` (Docusaurus copies it
  into the build).

## Steps

1. Push this repo to `github.com/aoneahsan/files-hub-docs` (remote `o`). The workflow at
   `.github/workflows/deploy.yml` builds with yarn and deploys `./build` to Pages on every push
   to `main`.
2. In GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. **Custom domain:** Settings → Pages → Custom domain → `fileshub-docs.zaions.com`. The
   `static/CNAME` file already pins it. Turn on **Enforce HTTPS** once the certificate provisions.
4. **DNS** — in the `zaions.com` zone, add:
   ```
   fileshub-docs.zaions.com  CNAME  aoneahsan.github.io.
   ```
   Wait for the GitHub Pages certificate to provision (can take up to ~24 h).

## After deploy — search-engine submission (do once)

- Verify `fileshub-docs.zaions.com` in **Google Search Console** and **Bing Webmaster Tools**;
  submit `https://fileshub-docs.zaions.com/sitemap.xml`.
- URL-inspect + request indexing for the intro, quick-start, and API overview pages.

## Verify it is live

```bash
curl -sI https://fileshub-docs.zaions.com/                 # 200
curl -s  https://fileshub-docs.zaions.com/openapi.json | head
curl -s  https://fileshub-docs.zaions.com/raw/manifest.json | head
curl -s  https://fileshub-docs.zaions.com/llms.txt | head
```

## Notes

- `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt`, `humans.txt`, `pricing.md`,
  `/.well-known/security.txt`, `/openapi.json`, and the `/raw/**` markdown mirror (with
  `/raw/manifest.json`) are all emitted at the site root.
- GitHub Pages is the only host. (Firebase Hosting was removed on 2026-07-14.)
