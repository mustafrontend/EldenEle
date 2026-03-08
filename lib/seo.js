const SITE_URL = 'https://eldenele.pet';

/**
 * Generate a URL-safe slug from Turkish text
 */
export function slugify(text) {
    if (!text) return '';
    const turkishMap = {
        'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I',
        'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U',
    };
    return text
        .split('')
        .map(ch => turkishMap[ch] || ch)
        .join('')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);
}

/**
 * Generate a unique URL slug from listing data (Format: {city}-{title}-{id})
 */
export function generateListingSlug(listing) {
    if (!listing) return '';
    const parts = [];
    if (listing.city) parts.push(slugify(listing.city));
    if (listing.title) parts.push(slugify(listing.title));
    const textSlug = parts.join('-') || 'ilan';

    // Fallback logic in case ID is missing
    if (!listing.id) return textSlug;
    return `${textSlug}-${listing.id}`;
}

/**
 * Get concept label for SEO
 */
export function getConceptLabel(concept) {
    const map = {
        'takas': 'Takas İlanı',
        'sahiplendirme': 'Hayvan Sahiplendirme',
        'yetenek': 'Yetenek & Hizmet',
        'bedelsiz': 'Bedelsiz Hediye',
        'geridonusum': 'Geri Dönüşüm',
        'odunc': 'Ödünç Paylaşım',
    };
    return map[concept] || 'İlan';
}

/**
 * Generate listing page title for SEO
 */
export function generateListingTitle(listing) {
    if (!listing) return 'İlan Bulunamadı | EldenEle.pet';
    const concept = getConceptLabel(listing.concept);
    const breedInfo = listing.breed ? ` (${listing.breed})` : '';
    const districtInfo = listing.district ? `${listing.district}, ` : '';
    const location = listing.city ? ` - ${districtInfo}${listing.city}` : '';

    return `${listing.title}${breedInfo} | ${concept}${location}`;
}

/**
 * Generate listing page description for SEO
 */
export function generateListingDescription(listing) {
    if (!listing) return 'EldenEle.pet üzerinde bu ilan bulunamadı.';
    const concept = getConceptLabel(listing.concept);
    const location = listing.city ? `${listing.city}${listing.district ? `, ${listing.district}` : ''}` : '';
    const breedStr = listing.breed ? `${listing.breed} türünde ` : '';

    const desc = listing.description
        ? listing.description.slice(0, 150).replace(/\n/g, ' ')
        : '';

    const parts = [concept];
    if (listing.category) parts.push(listing.category);
    if (location) parts.push(location);

    let meta = `${listing.title} — ${breedStr}${parts.join(' | ')}`;
    if (desc) meta += `. ${desc}`;

    // SEO Keywords injection in description for better indexing
    const keywords = [listing.city, listing.district, listing.breed, listing.category].filter(Boolean).join(', ');
    if (keywords) meta += ` [${keywords}]`;

    if (meta.length > 200) meta = meta.slice(0, 197) + '...';
    return meta;
}

/**
 * Generate JSON-LD for a listing (Schema.org Product or Service)
 */
export function generateListingJsonLd(listing) {
    if (!listing) return null;

    const isService = listing.concept === 'yetenek';
    const isAnimal = listing.concept === 'sahiplendirme';

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': isService ? 'Service' : 'Product',
        name: listing.title,
        description: listing.description || generateListingDescription(listing),
        url: `${SITE_URL}/ilan/${generateListingSlug(listing)}`,
        category: listing.category,
        ...(listing.photos && listing.photos.length > 0 && listing.photos[0].startsWith('http')
            ? { image: listing.photos.slice(0, 3) }
            : {}),
        offers: {
            '@type': 'Offer',
            price: listing.estimatedValue || 0,
            priceCurrency: 'TRY',
            availability: 'https://schema.org/InStock',
            itemCondition: listing.concept === 'geridonusum'
                ? 'https://schema.org/UsedCondition'
                : 'https://schema.org/NewCondition',
        },
        ...(listing.city && {
            areaServed: {
                '@type': 'City',
                name: listing.city,
            },
        }),
        seller: {
            '@type': 'Person',
            name: listing.userName || 'EldenEle Kullanıcısı',
        },
        datePosted: listing.createdAt?.seconds
            ? new Date(listing.createdAt.seconds * 1000).toISOString()
            : undefined,
    };

    // Free items
    if (['bedelsiz', 'odunc', 'sahiplendirme'].includes(listing.concept)) {
        jsonLd.offers.price = 0;
        jsonLd.offers.priceValidUntil = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
    }

    return jsonLd;
}

/**
 * Generate JSON-LD for the organization (homepage)
 */
export function generateOrganizationJsonLd() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'EldenEle.pet',
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        description: 'Türkiye\'nin değer odaklı paylaşım platformu. Takas, sahiplendirme, bedelsiz hediye, yetenek takası ve daha fazlası.',
        sameAs: [],
        contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            availableLanguage: 'Turkish',
        },
    };
}

/**
 * Generate JSON-LD WebSite with SearchAction (Google Sitelinks Searchbox)
 */
export function generateWebSiteJsonLd() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'EldenEle.pet',
        url: SITE_URL,
        description: 'Türkiye\'nin en büyük takas ve paylaşım platformu',
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${SITE_URL}/?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    };
}

/**
 * Generate JSON-LD BreadcrumbList
 */
export function generateBreadcrumbJsonLd(items) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
            '@type': 'ListItemElement',
            position: i + 1,
            name: item.name,
            item: item.url ? `${SITE_URL}${item.url}` : undefined,
        })),
    };
}

/**
 * Generate JSON-LD ItemList for listing grids (homepage)
 */
export function generateItemListJsonLd(listings) {
    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        numberOfItems: listings.length,
        itemListElement: listings.slice(0, 20).map((listing, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${SITE_URL}/ilan/${generateListingSlug(listing)}`,
            name: listing.title,
        })),
    };
}

export { SITE_URL };
