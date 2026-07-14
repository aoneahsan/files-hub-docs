# CLAUDE.md — files-hub-docs

Public Docusaurus documentation site for **FilesHub** (the file-storage + utility API at
[fileshub.zaions.com](https://fileshub.zaions.com)).

## Task Speed Over Docs (IRON-SOLID — BEHAVIORAL)

Finish the real task fast + correctly FIRST; docs/trackers/sync are a footnote (≤~20% of effort) — never let recording outpace the fix. HARD STOP when doc work outpaces the change → ship, then ONE line if anything. No new summary/status/completion files unless asked; edit/delete over add; delete stale docs. Full rule: `~/.claude/CLAUDE.md`. (Est. 2026-06-19)

## Model Workflow — Fable 5 plans & reviews, Opus 4.8 implements (IRON-SOLID — CRITICAL)

- **Plan + review on Fable 5; implement on Opus 4.8** — always, for every task in this project. Fable writes the plan to `~/.claude/plans/` + a resumable tracker; Opus reads BOTH and implements exactly (NEVER re-plans from zero); Fable then reviews the diff vs the plan and appends `§FINDINGS` for Opus to fix.
- **NO sub-agents, ever** — all planning/implementation/review happens in the MAIN context.
- **Skills mandatory (RULE #0)** — invoke every relevant skill before acting, on both planning and implementation sides.
- Global rule: `~/.claude/CLAUDE.md` → "Model Workflow". (Owner directive 2026-07-14; adopted here same day.)
- **Active plan awaiting Opus 4.8:** `~/.claude/plans/great-our-project-is-eventual-sun.md` (PART B) → tracker `docs/tracking/docs-finalization-tracker.json` (finalize for GitHub Pages @ **fileshub-docs.zaions.com**: domain switch, full API docs, raw-md mirror + manifest, OpenAPI 3.1 core, drop Firebase).

## Identity

| Key | Value |
|---|---|
| Repo | `files-hub-docs` — `github.com/aoneahsan/files-hub-docs` (PUBLIC), remote `o` |
| Type | Docusaurus 3 documentation site (classic preset + Mermaid) |
| Package manager | yarn (classic) — NEVER npm/pnpm |
| Node | >=18 |
| Author | Ahsan Mahmood ([aoneahsan@gmail.com](mailto:aoneahsan@gmail.com)) |
| Live URL | https://docs.fileshub.zaions.com (Firebase Hosting site `files-hub-docs` + GitHub Pages; CNAME in `static/CNAME`) |
| Documents | FilesHub API: `X-API-Key` auth, `POST/GET/DELETE /api/v1/objects`, visibility public/private |
| Source product | `/home/ahsan/Documents/01-code/projects/files-hub/` (Laravel + Nova; PRIVATE repo) |
| Content tracker | `docs/tracking/files-hub-docs-content-tracker.json` |
| Build gates (2026-06-23) | `yarn install` exit 0 · `yarn build` (docusaurus → `./build`) exit 0 |

## Critical rules

| Rule | Detail |
|---|---|
| Yarn only | Never `npm install`/`pnpm add`. Only `yarn.lock`. |
| No dev server in agent runs | Agent runs `yarn build` / `yarn typecheck` to verify; the user runs `yarn start`. |
| Single source of truth | Every API fact comes from the FilesHub controller source (`files-hub/app/Http/Controllers/Api/ObjectController.php`, `routes/api.php`, `config/fileshub.php`). No invented endpoints/fields. |
| Honest framing | Say what FilesHub does NOT do (single-region, 10 MB default cap, no published SDK). No fabricated stats. |
| No secrets | PUBLIC repo — never commit any `.env`, key, or token. |
| One commit per task | One commit per docs change/batch, pushed to `o main`. |

## Verification

```bash
yarn install         # node-modules linker (see .yarnrc.yml)
yarn build           # docusaurus build → ./build (must exit 0)
yarn typecheck       # tsc --noEmit
```

> Note: a green `yarn install`/`yarn build` is the gate. If a git-submodule-style env quirk
> appears in CI it is environmental, not a real build failure.

## Hosting

- **GitHub Pages:** `.github/workflows/deploy.yml` (enable Pages → "GitHub Actions" once). Custom domain via `static/CNAME`.
- **Firebase Hosting:** `firebase.json` + `.firebaserc` (site `files-hub-docs`); `yarn firebase:deploy`. Full steps in `DEPLOY.md`.

## Package Manager Hierarchy: nvm → npm (global) → yarn (local) (IRON-SOLID)

`nvm` installs/updates Node+npm; `npm` for ALL global installs (incl. yarn itself); `yarn` for ALL local work. Never `npm`/`pnpm` for local installs; never `pnpm` at all. Only `yarn.lock` in the repo.

## SEO / AEO

robots.txt (AI-bot allowlist), sitemap.xml (Docusaurus), llms.txt + llms-full.txt, pricing.md, humans.txt, `/.well-known/security.txt`, and JSON-LD (WebSite + Organization + SoftwareApplication) are all emitted. Per-page definition-first intros, FAQ, distinct titles/descriptions. Playbook: `~/.claude/rules/seo-aeo-ranking.md`. Last applied: 2026-06-23.

## Gitignore Hygiene (IRON-SOLID)
`.gitignore` stays current with the project structure — ignore only recoverable artifacts (build/`dist`/`www`/`node_modules`/logs/caches/IDE), never lose source. Custom rules always present: `*.ignore.*`, `project-record-ignore/`. This is a **PUBLIC** repo -> secrets/`.env`/keystores are NEVER tracked.
Full rule + private/public protocol: `~/.claude/rules/project-config.md`.
Gitignore Last Verified: 2026-06-24

## Last Updated

2026-06-23


## Sub-agents & Skills — Main-Context-First (IRON-SOLID)
Default/built-in sub-agents (`general-purpose`, `Explore`, `Plan`, `claude`, `fork`, …) do NOT have
access to `/skills`, so delegating to them silently SKIPS the skills RULE #0 requires. Do all
skill-relevant work in the **MAIN context**; use a sub-agent ONLY when a **custom** agent exists in
`.claude/agents/` for that job; a default `Explore`/`Plan` agent is allowed ONLY for read-only,
no-skill search/exploration. When a relevant skill is missing, **install/enable it** rather than
proceeding skill-less. (Owner directive 2026-07-11; full text in `~/.claude/CLAUDE.md`.)
