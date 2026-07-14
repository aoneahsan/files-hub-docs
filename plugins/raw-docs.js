// Local Docusaurus plugin: mirror every docs page as raw Markdown under
// /raw/** at build time, and emit /raw/manifest.json. This gives AI coding
// agents (Claude Code, Codex, etc.) a clean, downloadable, un-rendered copy of
// each page plus an index they can crawl to load the whole doc set into context.
//
// Registered in docusaurus.config.ts (plugins: ['./plugins/raw-docs.js']).

const fs = require('fs');
const path = require('path');

/**
 * Pull `title` and `description` out of a page's YAML front matter, falling
 * back to the first `# ` heading for the title.
 */
function extractMeta(content) {
  let title = null;
  let description = null;

  const fm = content.match(/^---\n([\s\S]*?)\n---/);
  if (fm) {
    const titleLine = fm[1].match(/^title:\s*(.+)$/m);
    const descLine = fm[1].match(/^description:\s*(.+)$/m);
    if (titleLine) title = titleLine[1].trim().replace(/^["']|["']$/g, '');
    if (descLine) description = descLine[1].trim().replace(/^["']|["']$/g, '');
  }
  if (!title) {
    const h1 = content.match(/^#\s+(.+)$/m);
    if (h1) title = h1[1].trim();
  }
  return { title, description };
}

/** Recursively collect every .md / .mdx file under a directory. */
function collectDocs(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectDocs(full, acc);
    } else if (/\.mdx?$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

module.exports = function rawDocsPlugin() {
  return {
    name: 'raw-docs',
    async postBuild({ siteDir, outDir, siteConfig }) {
      const docsDir = path.join(siteDir, 'docs');
      if (!fs.existsSync(docsDir)) return;

      const rawOutDir = path.join(outDir, 'raw');
      const files = collectDocs(docsDir);
      const manifest = [];

      for (const abs of files) {
        // /raw/ mirrors the docs tree; .mdx is served as .md.
        const rel = path.relative(docsDir, abs).replace(/\.mdx$/, '.md');
        const dest = path.join(rawOutDir, rel);
        fs.mkdirSync(path.dirname(dest), { recursive: true });

        const content = fs.readFileSync(abs, 'utf8');
        fs.writeFileSync(dest, content);

        const { title, description } = extractMeta(content);
        manifest.push({
          path: rel,
          url: `${siteConfig.url}/raw/${rel}`,
          title,
          description,
        });
      }

      manifest.sort((a, b) => a.path.localeCompare(b.path));

      const manifestObj = {
        generatedAt: new Date().toISOString(),
        site: siteConfig.url,
        description:
          'Raw Markdown mirror of every FilesHub documentation page. Each url returns the un-rendered .md (front matter included). Built for AI coding agents. See also /openapi.json.',
        count: manifest.length,
        files: manifest,
      };
      fs.writeFileSync(
        path.join(rawOutDir, 'manifest.json'),
        JSON.stringify(manifestObj, null, 2)
      );

      console.log(`[raw-docs] wrote ${manifest.length} raw pages + manifest.json to /raw/`);
    },
  };
};
