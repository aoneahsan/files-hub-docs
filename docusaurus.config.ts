import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// ---------------------------------------------------------------------------
// FilesHub — Documentation site config
// Author: Ahsan Mahmood (https://aoneahsan.com)
// Product: https://fileshub.zaions.com  (API base: https://fileshub.zaions.com/api/v1)
// ---------------------------------------------------------------------------

const SITE_URL = 'https://docs.fileshub.zaions.com';

const config: Config = {
  title: 'FilesHub Docs',
  tagline: 'Zero-cost file storage + utility API for every app. Upload, store, and serve files over a simple HTTP API keyed by X-API-Key.',
  favicon: 'img/favicon.svg',

  // Production URL — served from Firebase Hosting site `files-hub-docs`
  // and GitHub Pages (custom domain via static/CNAME).
  url: SITE_URL,
  baseUrl: '/',

  // GitHub metadata (drives OG tags + edit-this-page links + Pages deploy)
  organizationName: 'aoneahsan',
  projectName: 'files-hub-docs',

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'warn',

  // SEO + AI-citability head tags. The JSON-LD payloads (WebSite,
  // Organization, SoftwareApplication) help Google Rich Results,
  // Perplexity, ChatGPT, Gemini, and Claude extract structured entity
  // data when citing this documentation.
  headTags: [
    {
      tagName: 'link',
      attributes: { rel: 'canonical', href: `${SITE_URL}/` },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'alternate',
        type: 'application/xml',
        title: 'FilesHub Docs sitemap',
        href: `${SITE_URL}/sitemap.xml`,
      },
    },
    {
      tagName: 'meta',
      attributes: { name: 'application-name', content: 'FilesHub Docs' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'apple-mobile-web-app-title', content: 'FilesHub Docs' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'theme-color', content: '#6366f1' },
    },
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'FilesHub Documentation',
        url: SITE_URL,
        description:
          'Documentation for FilesHub, a zero-cost file-storage and utility API. Upload, store, list, and serve files over a simple HTTP API authenticated with an X-API-Key header. Maintained by Ahsan Mahmood.',
        inLanguage: 'en',
        publisher: {
          '@type': 'Person',
          name: 'Ahsan Mahmood',
          url: 'https://aoneahsan.com',
          email: 'aoneahsan@gmail.com',
          sameAs: [
            'https://linkedin.com/in/aoneahsan',
            'https://github.com/aoneahsan',
            'https://www.npmjs.com/~aoneahsan',
          ],
        },
      }),
    },
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'FilesHub',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web, Android, iOS, any HTTP client',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        url: 'https://fileshub.zaions.com',
        sameAs: SITE_URL,
        author: {
          '@type': 'Person',
          name: 'Ahsan Mahmood',
          url: 'https://aoneahsan.com',
        },
        description:
          'FilesHub is a file-storage and developer-utility API: upload files over HTTP, get a stable public URL, list and delete objects, set per-file visibility (public or private), and optional auto-expiry — plus 50+ utility endpoints. Authenticated with a per-project X-API-Key.',
      }),
    },
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Ahsan Mahmood',
        alternateName: 'aoneahsan',
        url: 'https://aoneahsan.com',
        email: 'aoneahsan@gmail.com',
        sameAs: [
          'https://linkedin.com/in/aoneahsan',
          'https://github.com/aoneahsan',
          'https://www.npmjs.com/~aoneahsan',
          'https://fileshub.zaions.com',
        ],
        founder: { '@type': 'Person', name: 'Ahsan Mahmood' },
      }),
    },
  ],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  trailingSlash: false,

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl: 'https://github.com/aoneahsan/files-hub-docs/edit/main/',
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
          breadcrumbs: true,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.7,
          lastmod: 'date',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.svg',
    metadata: [
      { name: 'description', content: 'Documentation for FilesHub — a zero-cost file-storage + utility API. Upload, store, list, and serve files over HTTP with an X-API-Key. Maintained by Ahsan Mahmood.' },
      { name: 'keywords', content: 'fileshub, file storage api, file upload api, http file storage, public file url, image hosting api, x-api-key, multipart upload, laravel file storage, store files api, free file storage backend, capacitor file upload, react file upload api' },
      { name: 'author', content: 'Ahsan Mahmood' },
      { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:creator', content: '@aoneahsan' },
      { name: 'twitter:site', content: '@aoneahsan' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'FilesHub Docs' },
      { property: 'og:locale', content: 'en_US' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'article:author', content: 'Ahsan Mahmood' },
    ],
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
    navbar: {
      title: 'FilesHub',
      logo: {
        alt: 'FilesHub logo',
        src: 'img/logo.svg',
        srcDark: 'img/logo.svg',
        width: 32,
        height: 32,
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'mainSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/getting-started/quick-start',
          label: 'Quick Start',
          position: 'left',
        },
        {
          to: '/api/overview',
          label: 'API Reference',
          position: 'left',
        },
        {
          href: 'https://fileshub.zaions.com',
          label: 'fileshub.zaions.com',
          position: 'right',
        },
        {
          to: '/about-the-author',
          label: 'Author',
          position: 'right',
        },
        {
          href: 'https://github.com/aoneahsan/files-hub-docs',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            { label: 'Introduction', to: '/intro' },
            { label: 'Quick Start', to: '/getting-started/quick-start' },
            { label: 'Authentication', to: '/getting-started/authentication' },
            { label: 'API Reference', to: '/api/overview' },
          ],
        },
        {
          title: 'Product',
          items: [
            { label: 'FilesHub app', href: 'https://fileshub.zaions.com' },
            { label: 'Integration overview', href: 'https://fileshub.zaions.com/ai-integration' },
            { label: 'Docs source', href: 'https://github.com/aoneahsan/files-hub-docs' },
          ],
        },
        {
          title: 'Built by Ahsan Mahmood',
          items: [
            { label: 'aoneahsan.com', href: 'https://aoneahsan.com' },
            { label: 'LinkedIn', href: 'https://linkedin.com/in/aoneahsan' },
            { label: 'GitHub', href: 'https://github.com/aoneahsan' },
            { label: 'npm packages', href: 'https://www.npmjs.com/~aoneahsan' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Ahsan Mahmood. Built with Docusaurus. FilesHub docs are MIT-licensed.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript', 'php', 'dart', 'yaml', 'diff'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
