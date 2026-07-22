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
        'getting-started/api-key-restrictions',
        'getting-started/file-visibility',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      collapsed: false,
      items: [
        'api/overview',
        {
          type: 'category',
          label: 'Objects',
          collapsed: true,
          items: [
            'api/upload-object',
            'api/get-object',
            'api/list-objects',
            'api/delete-object',
          ],
        },
        {
          type: 'category',
          label: 'Emails',
          collapsed: true,
          items: [
            'api/emails-send',
            'api/email-templates',
            'api/email-schedules',
          ],
        },
        {
          type: 'category',
          label: 'Jobs & Ops',
          collapsed: true,
          items: [
            'api/jobs',
            'api/version-health',
          ],
        },
        'api/errors-and-limits',
        'api/utilities-index',
        'api/openapi',
      ],
    },
    {
      type: 'category',
      label: 'Management API',
      collapsed: false,
      items: [
        'management-api/overview',
        'management-api/authentication',
        'management-api/endpoints',
        'management-api/supabase-projects',
        'management-api/agent-workflow',
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
