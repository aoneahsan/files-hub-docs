# AGENTS.md — files-hub-docs

Public Docusaurus documentation site for **FilesHub** (file-storage + utility API at
[fileshub.zaions.com](https://fileshub.zaions.com)). Mirror of `CLAUDE.md` — keep both in sync.

## Task Speed Over Docs (IRON-SOLID — BEHAVIORAL)

Finish the real task fast + correctly FIRST; docs/trackers/sync are a footnote (≤~20% of effort) — never let recording outpace the fix. HARD STOP when doc work outpaces the change → ship, then ONE line. No new summary/status files unless asked; edit/delete over add. Full rule: `~/.claude/CLAUDE.md`.

## Model Workflow — Fable 5 plans & reviews, Opus 4.8 implements (IRON-SOLID — CRITICAL)

- **Plan + review on Fable 5; implement on Opus 4.8** — always, for every task in this project. Fable writes the plan + a resumable tracker; Opus reads BOTH and implements exactly (NEVER re-plans from zero); Fable reviews the diff and appends `§FINDINGS` for Opus to fix.
- **NO sub-agents, ever** — all work in the MAIN context. **Skills mandatory (RULE #0).**
- Global rule: `~/.claude/CLAUDE.md` → "Model Workflow". (Owner directive 2026-07-14; adopted here same day.)
- **Active plan awaiting Opus 4.8:** `~/.claude/plans/great-our-project-is-eventual-sun.md` (PART B) → tracker `docs/tracking/docs-finalization-tracker.json` (finalize for GitHub Pages @ **fileshub-docs.zaions.com**: domain switch, full API docs, raw-md mirror + manifest, OpenAPI 3.1 core, drop Firebase).

## Identity

| Key | Value |
|---|---|
| Repo | `github.com/aoneahsan/files-hub-docs` (PUBLIC), remote `o` |
| Type | Docusaurus 3 (classic preset + Mermaid), yarn-only, Node ≥18 |
| Live URL | https://fileshub-docs.zaions.com (**GitHub Pages only**; Firebase removed 2026-07-14) |
| Source product | `/home/ahsan/Documents/01-code/projects/files-hub/` (Laravel + Nova, PRIVATE) |
| Content tracker | `docs/tracking/files-hub-docs-content-tracker.json` |
| Author | Ahsan Mahmood (aoneahsan@gmail.com) |

## Build / verify commands

```bash
yarn install         # node-modules linker (.yarnrc.yml)
yarn build           # docusaurus build → ./build (must exit 0)
yarn typecheck       # tsc --noEmit
yarn start           # dev server :5994 (USER runs this; agents do not)
yarn serve           # preview built site :5995
```

## Rules

- **Yarn only** — never npm/pnpm; only `yarn.lock`.
- **No dev/preview servers in agent runs** — verify via `yarn build`/`yarn typecheck` only.
- **Single source of truth** — every API fact comes from the FilesHub source (`app/Http/Controllers/Api/*`, `app/Http/Requests/Api/*`, `routes/api.php`, `config/fileshub.php`, `app/Http/Middleware/ApiKeyAuth.php`). No invented endpoints, params, or response fields.
- **Honest framing** — document FilesHub's real limits (single-region, 10 MB default cap, no published SDK, restrictions = header allowlisting not attestation). No fabricated stats.
- **AI surfaces** — `static/openapi.json` (lint with `npx -y @redocly/cli@latest lint`) + `plugins/raw-docs.js` `/raw/**` mirror + `src/theme/DocItem/Content` "View raw" link. Any `/raw/...` link in Markdown must be an ABSOLUTE URL (postBuild files are invisible to `onBrokenLinks: throw`).
- **PUBLIC repo — NO secrets.** Never commit any `.env`, API key, or token.
- **One commit per task**, pushed to `o main`.

## Hosting

- **GitHub Pages only** (Firebase removed 2026-07-14): `.github/workflows/deploy.yml` + `static/CNAME` (`fileshub-docs.zaions.com`). Deploy + DNS steps (human-only): `DEPLOY.md`.

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
