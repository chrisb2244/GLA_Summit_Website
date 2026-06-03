import type { Metadata } from 'next';
import { ticketYear } from './configConstants';

export const siteTitle = `GLA Summit ${ticketYear}`;
export const siteDescription = 'A global online LabVIEW conference';
export const ogImageUrl = `/api/og/${ticketYear}`;

// Next.js merges metadata *shallowly*: a segment that defines `openGraph` (or
// `twitter`) overwrites the parent's value entirely rather than deep-merging.
// So any page that needs a page-specific og:url must re-supply the shared
// fields (notably the og:image) or it would silently drop them. This helper
// builds a complete openGraph object, overriding only title/url per page.
//
// `url` is relative so it resolves against `metadataBase` (set in the root
// layout): production -> https://www.glasummit.org, preview -> the deploy URL.
// Keeping it self-referential avoids social crawlers re-fetching a hardcoded
// canonical host and masking this page's image with that host's tags.
export function buildOpenGraph(
  overrides: { title?: string; url?: string } = {}
): NonNullable<Metadata['openGraph']> {
  return {
    title: overrides.title ?? siteTitle,
    description: siteDescription,
    url: overrides.url ?? '/',
    type: 'website',
    siteName: siteTitle,
    images: [{ url: ogImageUrl, width: 1200, height: 630, alt: siteTitle }]
  };
}
