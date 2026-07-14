# FilesHub Docs

Public documentation site for **FilesHub** — the zero-cost file-storage + developer-utility API at [fileshub.zaions.com](https://fileshub.zaions.com) used as the upload backend by every Aoneahsan/Zaions project.

- **Live docs:** https://fileshub-docs.zaions.com
- **Product:** https://fileshub.zaions.com  ·  **API base:** `https://fileshub.zaions.com/api/v1`
- **Built with:** [Docusaurus 3](https://docusaurus.io/) (React 19, TypeScript)
- **Hosting:** GitHub Pages (free, auto-deploy on push)
- **For AI agents:** [`/openapi.json`](https://fileshub-docs.zaions.com/openapi.json) (OpenAPI 3.1) + a raw-Markdown mirror of every page under [`/raw/`](https://fileshub-docs.zaions.com/raw/manifest.json)
- **Author:** [Ahsan Mahmood](https://aoneahsan.com)

## What's documented

The full FilesHub API — the **object API** ([upload](https://fileshub-docs.zaions.com/api/upload-object), [download](https://fileshub-docs.zaions.com/api/get-object), [list](https://fileshub-docs.zaions.com/api/list-objects), [delete](https://fileshub-docs.zaions.com/api/delete-object)), the **email API** ([send](https://fileshub-docs.zaions.com/api/emails-send), templates, recurring schedules), [jobs](https://fileshub-docs.zaions.com/api/jobs), and [version/health](https://fileshub-docs.zaions.com/api/version-health) — plus authentication (`X-API-Key`, scopes), [API-key restrictions](https://fileshub-docs.zaions.com/getting-started/api-key-restrictions) for shipping a key in a frontend, file visibility (`public`/`private`), integration guides, a map of the 40+ developer utilities, and an FAQ.

## Local development

This is a **yarn-only** repo (nvm → npm for globals → yarn for local work).

```bash
yarn install      # install deps
yarn start        # dev server on http://localhost:5994  (run it yourself; agents don't)
yarn build        # production build → ./build  (must exit 0)
yarn typecheck    # tsc --noEmit  (must exit 0)
yarn serve        # preview the built site on :5995
```

## Deploying

See [`DEPLOY.md`](./DEPLOY.md). **GitHub Pages** is the single host: push to `main` and the [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) workflow builds and deploys (enable Pages → Source "GitHub Actions" once). Custom domain `fileshub-docs.zaions.com` via [`static/CNAME`](./static/CNAME).

## Editing content

Pages are Markdown under [`docs/`](./docs); the sidebar is [`sidebars.ts`](./sidebars.ts); site config is [`docusaurus.config.ts`](./docusaurus.config.ts). Keep every API fact consistent with the real FilesHub controller behaviour — these docs are written from the source, not guessed.

## License

MIT. © Ahsan Mahmood.
