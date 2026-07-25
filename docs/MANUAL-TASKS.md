# Manual / User-Only Tasks — Files Hub Docs

> The ONE place for everything only you (the human) can do. Fixed path: `docs/MANUAL-TASKS.md`.
> Global spec: `~/.claude/rules/manual-tasks.md`. Excluded from the published site (see
> `docusaurus.config.ts` → `docs.exclude`) because this repo is public.
> Last updated: 2026-07-25

## ⏳ Pending manual tasks

| # | Task | Why only you | Status |
|---|------|--------------|--------|
| 1 | **Add DNS.** In Hostinger, add a `CNAME` record `fileshub-docs` → `aoneahsan.github.io` on `zaions.com`. | Only you control the `zaions.com` DNS zone. | ☐ Not started |
| 2 | **Configure GitHub Pages.** Repo **Settings → Pages**: source = **GitHub Actions**, custom domain = `fileshub-docs.zaions.com`, then **Enforce HTTPS** once the certificate provisions. | Repo settings are owner-only. | ☐ Not started |

`static/CNAME` already ships `fileshub-docs.zaions.com` inside `build/`, and `.github/workflows/deploy-pages.yml` builds and
publishes on every push to `main` — these steps are all that remain.

## ✅ Completed manual tasks

| # | Task | Resolution | Date |
|---|------|-----------|------|
| — | — | — | — |
