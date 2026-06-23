# Deploying the FilesHub docs site

This PUBLIC docs site is published two ways, both free. You only need one; setting up both gives a fallback.

> These are **human-only** steps (they need a Firebase login, repo settings, or DNS access). An agent prepares the config; you run the deploy. This file is referenced from `files-hub/docs/MANUAL-TASKS.md`.

## Prerequisites

- Node ≥ 18, yarn (classic). `yarn install` then `yarn build` must produce `./build`.
- Custom domain: **`docs.fileshub.zaions.com`** (carried by `static/CNAME`, which Docusaurus copies into the build).

---

## Option A — GitHub Pages (recommended, fully automated)

1. Push this repo to `github.com/aoneahsan/files-hub-docs` (already the `o` remote).
2. In GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The workflow at `.github/workflows/deploy.yml` runs on every push to `main`: it builds with yarn and deploys the `./build` output to Pages.
4. **Custom domain:** Settings → Pages → Custom domain → `docs.fileshub.zaions.com`. The `static/CNAME` file already pins it; add the DNS record below.
5. **DNS:** at the registrar for `fileshub.zaions.com`, add a `CNAME` record:
   ```
   docs.fileshub.zaions.com  CNAME  aoneahsan.github.io.
   ```
   (Or the apex/ALIAS form your DNS host requires for GitHub Pages.) Wait for HTTPS to provision.

---

## Option B — Firebase Hosting

1. Create (or pick) a Firebase project and a Hosting **site** named `files-hub-docs`. `.firebaserc` points `default` → `files-hub-docs`.
2. Authenticate: `npx -y firebase-tools@latest login` (interactive) or set a CI token.
3. Deploy:
   ```bash
   yarn firebase:deploy            # builds, then deploys ./build to Hosting
   # preview channel (7-day):
   yarn firebase:deploy:preview
   ```
4. **Custom domain:** Firebase Console → Hosting → Add custom domain → `docs.fileshub.zaions.com` → follow the TXT/CNAME verification it shows.

---

## After deploy — search-engine submission (do once)

- Verify `docs.fileshub.zaions.com` in **Google Search Console** and **Bing Webmaster Tools**; submit `https://docs.fileshub.zaions.com/sitemap.xml`.
- URL-inspect + request indexing for the intro, quick-start, and API overview pages.

## Notes

- `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt`, `humans.txt`, `pricing.md`, and `/.well-known/security.txt` are emitted at the site root.
- If you only want one host, pick GitHub Pages (zero ongoing cost, auto-deploy on push) and skip Option B.
