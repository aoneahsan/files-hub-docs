import React, {type ReactNode} from 'react';
import Content from '@theme-original/DocItem/Content';
import type ContentType from '@theme/DocItem/Content';
import type {WrapperProps} from '@docusaurus/types';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

type Props = WrapperProps<typeof ContentType>;

// Wrap each doc page with a small "raw Markdown" affordance for AI agents.
// The /raw/** mirror is emitted at build time by plugins/raw-docs.js; we link
// to it with an ABSOLUTE URL so Docusaurus's broken-link checker (which runs
// before postBuild and doesn't know about /raw/**) treats it as external.
export default function ContentWrapper(props: Props): ReactNode {
  const {metadata} = useDoc();
  const {siteConfig} = useDocusaurusContext();

  const rawPath = metadata.source
    .replace(/^@site\/docs\//, '/raw/')
    .replace(/\.mdx$/, '.md');
  const rawUrl = `${siteConfig.url}${rawPath}`;

  return (
    <>
      <div className="raw-md-links" role="note" aria-label="Raw Markdown for AI agents">
        <span className="raw-md-links__label">For AI agents:</span>
        <a href={rawUrl} target="_blank" rel="noopener noreferrer">View raw Markdown</a>
        <span aria-hidden="true">·</span>
        <a href={rawUrl} download>Download .md</a>
      </div>
      <Content {...props} />
    </>
  );
}
