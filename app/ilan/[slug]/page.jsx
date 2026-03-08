import { getListingServer } from '../../../lib/firebaseServer';
import { generateListingSlug } from '../../../lib/seo';
import {
    generateListingTitle,
    generateListingDescription,
    generateListingJsonLd,
    generateBreadcrumbJsonLd,
    getConceptLabel,
    SITE_URL,
} from '../../../lib/seo';
import { redirect } from 'next/navigation';
import ListingDetailClient from './ListingDetailClient';

/**
 * Resolve a slug param to a listing by extracting the ID from the end.
 * Format expected: bursa-test-abc123xyz
 */
async function resolveListing(slugParam) {
    if (!slugParam) return null;

    // Extract ID from the end of the slug
    const parts = slugParam.split('-');
    let idFromSlug = parts[parts.length - 1]; // Assume last part is ID

    let listing = await getListingServer(idFromSlug);

    // Fallback: If not found, maybe the entire slug IS the ID (from old URLs)
    if (!listing && idFromSlug !== slugParam) {
        listing = await getListingServer(slugParam);
    }

    return listing;
}

/**
 * SSR — Dynamic metadata for every listing page
 */
export async function generateMetadata({ params }) {
    const { slug } = await params;
    const listing = await resolveListing(slug);

    if (!listing) {
        return {
            title: 'İlan Bulunamadı',
            description: 'Aradığınız ilan EldenEle.app üzerinde bulunamadı.',
            robots: { index: false, follow: true },
        };
    }

    const title = generateListingTitle(listing);
    const description = generateListingDescription(listing);
    const conceptLabel = getConceptLabel(listing.concept);
    const correctSlug = generateListingSlug(listing);
    const url = `${SITE_URL}/ilan/${correctSlug}`;

    const ogImages = [];
    if (listing.photos && listing.photos.length > 0) {
        if (listing.photos[0].startsWith('http')) {
            ogImages.push({ url: listing.photos[0], width: 800, height: 600, alt: listing.title });
        }
    }

    return {
        title,
        description,
        keywords: [
            listing.title, listing.category, conceptLabel, listing.city, listing.district,
            'takas', 'eldenele', 'ilan',
            listing.concept === 'sahiplendirme' ? 'hayvan sahiplen' : '',
            listing.concept === 'bedelsiz' ? 'ücretsiz eşya' : '',
            listing.concept === 'yetenek' ? 'hizmet takası' : '',
        ].filter(Boolean),
        openGraph: {
            type: 'article',
            locale: 'tr_TR',
            url,
            title: listing.title,
            description,
            siteName: 'EldenEle.app',
            ...(ogImages.length > 0 && { images: ogImages }),
            article: {
                publishedTime: listing.createdAt?.seconds ? new Date(listing.createdAt.seconds * 1000).toISOString() : undefined,
                section: conceptLabel,
                tags: [listing.category, conceptLabel, listing.city].filter(Boolean),
            },
        },
        twitter: {
            card: ogImages.length > 0 ? 'summary_large_image' : 'summary',
            title: listing.title,
            description,
            ...(ogImages.length > 0 && { images: [ogImages[0].url] }),
        },
        alternates: { canonical: url },
        robots: {
            index: true, follow: true,
            googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
        },
    };
}

/**
 * Server Component — resolves slug, handles 301 redirects for incorrect slugs,
 * renders JSON-LD, passes data to client
 */
export default async function ListingDetailPage({ params }) {
    const { slug } = await params;
    const listing = await resolveListing(slug);

    if (listing) {
        // If the URL slug does not perfectly match the correct slug, redirect for SEO
        const correctSlug = generateListingSlug(listing);
        if (slug !== correctSlug) {
            redirect(`/ilan/${correctSlug}`);
        }
    }

    const listingJsonLd = listing ? generateListingJsonLd(listing) : null;
    const breadcrumbJsonLd = listing
        ? generateBreadcrumbJsonLd([
            { name: 'Anasayfa', url: '/' },
            { name: getConceptLabel(listing.concept), url: `/?concept=${listing.concept}` },
            { name: listing.category, url: `/?category=${listing.category}` },
            { name: listing.title },
        ])
        : null;

    return (
        <>
            {listingJsonLd && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd) }} />
            )}
            {breadcrumbJsonLd && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            )}
            <ListingDetailClient slug={slug} serverListing={listing} />
        </>
    );
}
