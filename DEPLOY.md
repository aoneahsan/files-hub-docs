# Deploying the FilesHub docs site

This PUBLIC docs site is published on **GitHub Pages** at **`fileshub-docs.zaions.com`**, served from
the `gh-pages` branch. It is published by hand: there is no GitHub Actions workflow (house rule 2026-10-31).

> These are **human-only** steps (they need repo settings or DNS access). An agent prepares the
> config and content; you enable Pages and add the DNS record once. This file is referenced from
> `files-hub/docs/MANUAL-TASKS.md`.

## Prerequisites

- Node 26.13.1 LTS (`.nvmrc`) and Yarn. `yarn install` then `yarn build` must produce `./build`.
- Custom domain **`fileshub-docs.zaions.com`**, carried by `static/CNAME` (Docusaurus copies it
  into the build).

## Steps

1. Commit and push the source to `main` (remote `o`). `yarn build` must produce `./build` with zero errors.
2. Inspect `build/` in the automation browser at 1440 and 390, then publish it: check out `gh-pages` in the
   workspace `temp/` folder as a worktree, replace its files with `build/` (keep `.git`), commit
   "Publish files-hub-docs <main sha>: <what changed>" as a fast-forward, push `gh-pages`, remove the worktree.
   Pages → Source stays **Deploy from a branch: `gh-pages` / root**.
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
