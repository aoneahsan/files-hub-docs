import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

/**
 * Sidebar layout for the FilesHub docs.
 * Every entry maps to a real .md file under ./docs.
 */
const sidebars: SidebarsConfig = {
  mainSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/quick-start',
        'getting-started/authentication',
        'getting-started/file-visibility',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      collapsed: false,
      items: [
        'api/overview',
        'api/upload-object',
        'api/get-object',
        'api/list-objects',
        'api/delete-object',
        'api/errors-and-limits',
      ],
    },
    {
      type: 'category',
      label: 'Integration Guides',
      collapsed: true,
      items: [
        'guides/integrate-from-any-app',
        'guides/browser-and-mobile-uploads',
      ],
    },
    'platform-services',
    'faq',
    'privacy',
    'changelog',
    {
      type: 'category',
      label: 'About',
      collapsed: true,
      items: ['about-the-author'],
    },
  ],
};

export default sidebars;
