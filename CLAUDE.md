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
| Live URL | https://fileshub-docs.zaions.com (**GitHub Pages only**; CNAME in `static/CNAME`) |
| Documents | FilesHub API: `X-API-Key` auth + scopes/restrictions, objects, email (send/templates/schedules), jobs, version/health, visibility public/private; AI surfaces: `/openapi.json` + `/raw/**` mirror |
| Source product | `/home/ahsan/Documents/01-code/projects/files-hub/` (Laravel + Nova; PRIVATE repo) |
| Content tracker | `docs/tracking/files-hub-docs-content-tracker.json` |
| Build gates (2026-06-23) | `yarn install` exit 0 · `yarn build` (docusaurus → `./build`) exit 0 |

## Critical rules

| Rule | Detail |
|---|---|
| Yarn only | Never `npm install`/`pnpm add`. Only `yarn.lock`. |
| No dev server in agent runs | Agent runs `yarn build` / `yarn typecheck` to verify; the user runs `yarn start`. |
| Single source of truth | Every API fact comes from the FilesHub source (`files-hub/app/Http/Controllers/Api/*Controller.php`, `app/Http/Requests/Api/*`, `routes/api.php`, `config/fileshub.php`, `app/Http/Middleware/ApiKeyAuth.php`). No invented endpoints/fields. |
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

- **GitHub Pages only** (Firebase Hosting removed 2026-07-14): `.github/workflows/deploy.yml` auto-deploys `./build` on every push to `main`. Enable Pages → Source "GitHub Actions" once; custom domain `fileshub-docs.zaions.com` via `static/CNAME`. Full steps + DNS in `DEPLOY.md`.

## AI-agent surfaces

- `static/openapi.json` — hand-authored OpenAPI 3.1 (objects, emails, jobs, schedules, templates, version/health). Lint: `npx -y @redocly/cli@latest lint static/openapi.json` (0 errors).
- `plugins/raw-docs.js` — `postBuild` mirrors every docs page to `build/raw/**.md` + `build/raw/manifest.json`. `src/theme/DocItem/Content/index.tsx` adds a "View raw Markdown" link per page (absolute URL so `onBrokenLinks: throw` ignores the postBuild files). Any relative `/raw/...` link in Markdown must be absolute for the same reason.

## Package Manager Hierarchy: nvm → npm (global) → yarn (local) (IRON-SOLID)

`nvm` installs/updates Node+npm; `npm` for ALL global installs (incl. yarn itself); `yarn` for ALL local work. Never `npm`/`pnpm` for local installs; never `pnpm` at all. Only `yarn.lock` in the repo.

## SEO / AEO

robots.txt (AI-bot allowlist), sitemap.xml (Docusaurus), llms.txt + llms-full.txt, pricing.md, humans.txt, `/.well-known/security.txt`, `openapi.json`, the `/raw/**` mirror, and JSON-LD (WebSite + Organization + SoftwareApplication) are all emitted. Per-page definition-first intros, FAQ, distinct titles/descriptions. Playbook: `~/.claude/rules/seo-aeo-ranking.md`. Last applied: 2026-07-14.

## Gitignore Hygiene (IRON-SOLID)
`.gitignore` stays current with the project structure — ignore only recoverable artifacts (build/`dist`/`www`/`node_modules`/logs/caches/IDE), never lose source. Custom rules always present: `*.ignore.*`, `project-record-ignore/`. This is a **PUBLIC** repo -> secrets/`.env`/keystores are NEVER tracked.
Full rule + private/public protocol: `~/.claude/rules/project-config.md`.
Gitignore Last Verified: 2026-06-24

## Last Updated

2026-07-14


## Sub-agents & Skills — Main-Context-First (IRON-SOLID)
Default/built-in sub-agents (`general-purpose`, `Explore`, `Plan`, `claude`, `fork`, …) do NOT have
access to `/skills`, so delegating to them silently SKIPS the skills RULE #0 requires. Do all
skill-relevant work in the **MAIN context**; use a sub-agent ONLY when a **custom** agent exists in
`.claude/agents/` for that job; a default `Explore`/`Plan` agent is allowed ONLY for read-only,
no-skill search/exploration. When a relevant skill is missing, **install/enable it** rather than
proceeding skill-less. (Owner directive 2026-07-11; full text in `~/.claude/CLAUDE.md`.)

<!-- RULE:main-context-model-workflow v2026-07-16 -->
## Main-Context + Skills + Model Workflow (IRON-SOLID — CRITICAL)
1. **NO default/built-in sub-agents** (`general-purpose`, `Explore`, `Plan`, `claude`, `fork`, …) for ANY work in
   this project — they cannot invoke /skills, which RULE #0 makes mandatory. Do ALL work (planning, implementation,
   review, exploration) in the MAIN context. A sub-agent is allowed ONLY when a CUSTOM agent exists in
   `.claude/agents/` for that exact job.
2. **Skills always:** before any task, scan the available-skills list and invoke EVERY relevant skill; if a needed
   skill is missing, download/enable/install it (or use the nearest installed equivalent and say so) — never
   proceed skill-less.
3. **Model workflow:** PLAN and REVIEW on **Fable 5**; EXECUTE the approved plan on **Opus 4.8**. Plans in
   `~/.claude/plans/`; multi-phase features keep a resumable tracker (`docs/features/<slug>/00-tracker.json`),
   resumed rather than re-planned from zero.

Global records (rules, policy, audit reports) live in the `ahsan-notebook` repo at
`static/assets/claude-code/`; the `~/.claude/…` paths are symlinks into it. Full text: `~/.claude/CLAUDE.md`.
(Owner directives 2026-07-11 / 2026-07-14; fleet-rolled 2026-07-16.)
