# AGENTS.md — files-hub-docs

Public Docusaurus documentation site for **FilesHub** (file-storage + utility API at
[fileshub.zaions.com](https://fileshub.zaions.com)). Mirror of `CLAUDE.md` — keep both in sync.

## Task Speed Over Docs (IRON-SOLID — BEHAVIORAL)

Finish the real task fast + correctly FIRST; docs/trackers/sync are a footnote (≤~20% of effort) — never let recording outpace the fix. HARD STOP when doc work outpaces the change → ship, then ONE line. No new summary/status files unless asked; edit/delete over add. Full rule: `~/.claude/CLAUDE.md`.

## Identity

| Key | Value |
|---|---|
| Repo | `github.com/aoneahsan/files-hub-docs` (PUBLIC), remote `o` |
| Type | Docusaurus 3 (classic preset + Mermaid), yarn-only, Node ≥18 |
| Live URL | https://docs.fileshub.zaions.com (Firebase Hosting `files-hub-docs` + GitHub Pages) |
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
- **Single source of truth** — every API fact comes from the FilesHub source (`ObjectController.php`, `routes/api.php`, `config/fileshub.php`). No invented endpoints, params, or response fields.
- **Honest framing** — document FilesHub's real limits (single-region, 10 MB default cap, no published SDK). No fabricated stats; cite the product, not guesses.
- **PUBLIC repo — NO secrets.** Never commit any `.env`, API key, or token.
- **One commit per task**, pushed to `o main`.

## Hosting

- GitHub Pages: `.github/workflows/deploy.yml` + `static/CNAME` (`docs.fileshub.zaions.com`).
- Firebase Hosting: `firebase.json` + `.firebaserc` (site `files-hub-docs`), `yarn firebase:deploy`.
- Deploy + DNS steps (human-only): `DEPLOY.md`.

## Gitignore Hygiene (IRON-SOLID)
`.gitignore` stays current with the project structure — ignore only recoverable artifacts (build/`dist`/`www`/`node_modules`/logs/caches/IDE), never lose source. Custom rules always present: `*.ignore.*`, `project-record-ignore/`. This is a **PUBLIC** repo -> secrets/`.env`/keystores are NEVER tracked.
Full rule + private/public protocol: `~/.claude/rules/project-config.md`.
Gitignore Last Verified: 2026-06-24

## Last Updated

2026-06-23
