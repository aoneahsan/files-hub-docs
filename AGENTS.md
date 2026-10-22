# FilesHub public docs

**Last Updated:** 2026-10-20

| Context | Value |
|---|---|
| Last optimized | 2026-10-14 |
| Next routine optimization eligible | 2026-11-13 |
| Guide bytes | 2245 B |

This public Docusaurus 3 repository `aoneahsan/files-hub-docs` uses `main` and GitHub Pages at `https://fileshub-docs.zaions.com`. The private Laravel source is `../fileshub/`; the parent `../` is a separate coordination repository. The previous `/projects/files-hub/` path is obsolete. The workspace coordinator is `../../../docs/tracking/fleet-maintenance-tracker.json`.

## Working rules

- Use Yarn locally. Never commit `.env`, keys, tokens or other secrets to this public repository. Read the actual private source (`app/Http/Controllers/Api/`, Form Requests, `routes/api.php`, `config/fileshub.php`, `ApiKeyAuth`) before stating an API fact or limit. Do not invent endpoints, fields, responses or usage figures.
- The site is hosted only on GitHub Pages: `.github/workflows/deploy-pages.yml` deploys a push to `main`; `static/CNAME` names the domain. Build the exact site and inspect it in controlled desktop/mobile Chrome before that push; verify the Pages run and live routes afterward.
- Keep OpenAPI 3.1 in `static/openapi.json`: nullable types use a union containing `null`, not the OpenAPI 3.0 `nullable` keyword. `plugins/raw-docs.js` mirrors Markdown under `/raw/`; raw links in Markdown need absolute URLs because the files arrive after the broken-link check. Update the visible page, spec and raw mirror together when API facts change. Before a push, run `php artisan docs:openapi` in `../fileshub/` (fails while any API route is missing; `--write` adds generated operations).
- Keep `docs/tracking/files-hub-docs-content-tracker.json` and `DEPLOY.md` aligned with shipped content. Treat `docs/tracking/docs-finalization-tracker.json` as a historical or active task record only after checking its current status. Read current Docusaurus config before editing SEO, sitemap or JSON-LD. User-visible prose follows the approved story process if a story Bible is added.

## Verification

```bash
yarn install --immutable
yarn typecheck
yarn build
yarn serve
```

Inspect the exact `build/` output in a controlled browser before a deploy-triggering push. No legacy Firebase deployment is needed in this fleet pass. The next routine context review is eligible 2026-11-13 unless structure or correctness changes.

## Stop-work Git gate

<!-- RULE:stop-work-git-gate v2026-10-20 -->

Before stopping, commit every legitimate change and work-progress checkpoint in this repository and each independent nested repository, fetch and merge the designated upstream, push the documented working branch, then verify an empty worktree and `0 0` ahead/behind. Never stash, discard, reset, rebase, or force-push. If synchronization is blocked, report the exact repository, branch, blocker, and next action instead of calling the work complete. The full workflow remains authoritative in `~/.claude/rules/git-workflow.md`.
