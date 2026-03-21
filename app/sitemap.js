import { getAllListingsServer } from '../lib/firebaseServer';
import { generateListingSlug, SITE_URL } from '../lib/seo';

export default async function sitemap() {
    const staticPages = [
        { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
        { url: `${SITE_URL}/giris`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
        { url: `${SITE_URL}/kayit`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    ];

    let listingPages = [];
    try {
        const listings = await getAllListingsServer();
        listingPages = listings.map(listing => {
            const slug = generateListingSlug(listing);
            return {
                url: `${SITE_URL}/ilan/${slug}`,
                lastModified: listing.createdAt?.seconds ? new Date(listing.createdAt.seconds * 1000) : new Date(),
                changeFrequency: 'weekly',
                priority: 0.8,
            };
        });
    } catch (err) {
        console.error('Sitemap: Error fetching listings', err);
    }

    return [...staticPages, ...listingPages];
}
