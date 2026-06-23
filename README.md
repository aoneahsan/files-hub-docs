# FilesHub Docs

Public documentation site for **FilesHub** — the zero-cost file-storage + developer-utility API at [fileshub.zaions.com](https://fileshub.zaions.com) used as the upload backend by every Aoneahsan/Zaions project.

- **Live docs:** https://docs.fileshub.zaions.com
- **Product:** https://fileshub.zaions.com  ·  **API base:** `https://fileshub.zaions.com/api/v1`
- **Built with:** [Docusaurus 3](https://docusaurus.io/) (React 19, TypeScript)
- **Hosting:** Firebase Hosting + GitHub Pages (both free)
- **Author:** [Ahsan Mahmood](https://aoneahsan.com)

## What's documented

The storage **object API** every app integrates — [upload](https://docs.fileshub.zaions.com/api/upload-object), [download](https://docs.fileshub.zaions.com/api/get-object), [list](https://docs.fileshub.zaions.com/api/list-objects), [delete](https://docs.fileshub.zaions.com/api/delete-object) — plus authentication (`X-API-Key`), file visibility (`public`/`private`), integration guides, a map of the 50+ utility endpoints, and an FAQ.

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

See [`DEPLOY.md`](./DEPLOY.md). Two free paths:

1. **GitHub Pages** — push to `main`; the `.github/workflows/deploy.yml` workflow builds and deploys (enable Pages → "GitHub Actions" once). Custom domain via [`static/CNAME`](./static/CNAME).
2. **Firebase Hosting** — `yarn firebase:deploy` (needs the `files-hub-docs` Firebase project + login).

## Editing content

Pages are Markdown under [`docs/`](./docs); the sidebar is [`sidebars.ts`](./sidebars.ts); site config is [`docusaurus.config.ts`](./docusaurus.config.ts). Keep every API fact consistent with the real FilesHub controller behaviour — these docs are written from the source, not guessed.

## License

MIT. © Ahsan Mahmood.
