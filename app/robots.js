import { SITE_URL } from '../lib/seo';

export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/profil', '/ilan-olustur', '/api'],
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: ['/profil', '/ilan-olustur', '/api'],
            },
            {
                userAgent: 'Bingbot',
                allow: '/',
                disallow: ['/profil', '/ilan-olustur', '/api'],
            }
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    };
}
