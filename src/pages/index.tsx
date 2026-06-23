import type { ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import styles from './index.module.css';

type Feature = {
  title: string;
  body: string;
};

const FEATURES: Feature[] = [
  {
    title: 'Upload over plain HTTP',
    body: 'POST a multipart file to /api/v1/objects with your X-API-Key and get back a stable public URL plus a ULID. No SDK to install — curl, fetch, axios, or any HTTP client works.',
  },
  {
    title: 'Per-file visibility',
    body: 'Mark each upload public or private. Public objects are served to anyone at their URL; private objects require a read-permission API key from the same project to download.',
  },
  {
    title: 'List, download, delete',
    body: 'Page through your project’s objects, stream any file back by its ULID, and permanently delete an object (the stored file is removed with it). Four endpoints cover the whole lifecycle.',
  },
  {
    title: 'Optional auto-expiry',
    body: 'Set expires_in_days or an absolute expires_at on upload and FilesHub treats the object as gone once it expires — a self-cleaning slot for temporary files like one-time exports or share links.',
  },
  {
    title: 'Scoped, restrictable API keys',
    body: 'Keys are per project with read / write permissions and optional origin / app-id restrictions, so a browser key can be locked to your domain and a mobile key to your bundle id.',
  },
  {
    title: '50+ utility endpoints',
    body: 'Beyond storage, FilesHub exposes hashing, encoding, converters, QR codes, short URLs, OTP, an encryption vault, image/PDF processing, and more — the same key, one base URL.',
  },
];

function HomepageHeader(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <h1 className={styles.heroTitle}>{siteConfig.title}</h1>
        <p className={styles.heroTagline}>{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--primary button--lg" to="/getting-started/quick-start">
            Quick Start — 5 min
          </Link>
          <Link className="button button--secondary button--lg" to="/api/overview">
            API Reference
          </Link>
          <Link className="button button--outline button--lg" href="https://fileshub.zaions.com">
            Open FilesHub
          </Link>
        </div>
      </div>
    </header>
  );
}

function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.featuresWrap}>
      <div className="container">
        <div className="row">
          {FEATURES.map((f) => (
            <div key={f.title} className="col col--4" style={{ marginBottom: '1.5rem' }}>
              <div className={styles.featureCard}>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureBody}>{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AuthorStrip(): ReactNode {
  return (
    <section className={styles.authorStrip}>
      <div className="container">
        <p>
          Built and maintained by{' '}
          <Link href="https://aoneahsan.com">Ahsan Mahmood</Link> —{' '}
          <Link href="https://linkedin.com/in/aoneahsan">LinkedIn</Link> ·{' '}
          <Link href="https://github.com/aoneahsan">GitHub</Link> ·{' '}
          <Link href="https://www.npmjs.com/~aoneahsan">npm</Link>
        </p>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} — File storage + utility API`}
      description="Documentation for FilesHub: upload, store, list, and serve files over a simple HTTP API authenticated with an X-API-Key, plus 50+ developer utility endpoints."
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <AuthorStrip />
      </main>
    </Layout>
  );
}
