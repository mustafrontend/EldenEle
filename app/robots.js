const SITE_URL = 'https://eldenele.app';

export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/profil', '/ilan-olustur'],
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: ['/profil', '/ilan-olustur'],
            },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    };
}
