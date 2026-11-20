/**
 * Every place FilesHub is released — the ONLY place a store or surface URL lives in this docs site
 * (standard aoneahsan-cccs-platform-links). Each surface passed its release proof on `verified`:
 * the dashboard and this site answered 200. The Play listing answers 404 (2026-11-20), so Android is not listed.
 */
export type PlatformId = 'web' | 'docs';

export interface Platform {
  id: PlatformId;
  /** Store or surface name (a proper name, not copy). */
  name: string;
  href: string;
  /** What this surface is for, in FilesHub's words. */
  title: string;
  text: string;
  cta: string;
  primary?: boolean;
  verified: string;
}

export const PLATFORMS: readonly Platform[] = [
  {id: 'web', name: 'FilesHub dashboard', href: 'https://fileshub.zaions.com', title: 'The dashboard', text: 'Projects, API keys, file storage and email for your apps, and your plan.', cta: 'Open FilesHub', primary: true, verified: '2026-11-20'},
  {id: 'docs', name: 'Documentation', href: 'https://fileshub-docs.zaions.com', title: 'These docs', text: 'A quick start and the full API reference.', cta: 'Read the docs', verified: '2026-11-20'},
];

export const APPS_PAGE = {
  title: 'Get FilesHub',
  description: 'Every place FilesHub is released: the dashboard and these docs.',
  lead: 'Manage your projects in the dashboard, and keep the API reference a tab away.',
} as const;

/** This site is the docs surface. */
export const CURRENT_SURFACE: PlatformId = 'docs';
export const OTHER_PLATFORMS: readonly Platform[] = PLATFORMS.filter((platform) => platform.id !== CURRENT_SURFACE);
export const PRIMARY_PLATFORM: Platform = PLATFORMS.find((platform) => platform.primary) ?? PLATFORMS[0];
export function platformHref(id: PlatformId): string {
  const found = PLATFORMS.find((platform) => platform.id === id);
  if (!found) throw new Error(`Unknown platform: ${id}`);
  return found.href;
}
/** `/apps` changes only when this list does: its sitemap date is the newest proof date. */
export const APPS_LASTMOD: string = PLATFORMS.map((platform) => platform.verified).sort().at(-1) ?? '2026-11-20';
