import "./globals.css";
import { AuthProvider } from "../lib/AuthContext";
import { generateOrganizationJsonLd, generateWebSiteJsonLd, SITE_URL } from "../lib/seo";
import ProgressBarProvider from "../components/ProgressBarProvider";
import BotSimulator from "../components/BotSimulator";
import LiveNotifications from "../components/LiveNotifications";

export const metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: "EldenEle.pet — Türkiye'nin Değer Odaklı Paylaşım Platformu",
        template: "%s | EldenEle.pet",
    },
    description: "Can dostlarımıza sıcak bir yuva bulun. Türkiye'nin en güvenilir hayvan sahiplendirme ve dayanışma platformu. Kedi, köpek ve diğer tüm küçük dostlarımıza ömürlük yuvalar sağlıyoruz.",
    keywords: [
        "hayvan sahiplendirme", "kedi sahiplen", "köpek sahiplen", "ücretsiz hayvan sahiplendirme",
        "hayvanseverler topluluğu", "acil yuva", "evcil hayvan", "pati dostları",
        "eldenele", "hayvan dayanışma", "mama bağışı", "sahiplendirme platformu"
    ],
    authors: [{ name: "EldenEle.pet" }],
    creator: "EldenEle.pet",
    publisher: "EldenEle.pet",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        type: "website",
        locale: "tr_TR",
        url: SITE_URL,
        siteName: "EldenEle.pet",
        title: "EldenEle.pet — Türkiye'nin Değer Odaklı Paylaşım Platformu",
        description: "Takas yap, sahiplendir, bedelsiz hediye ver, yeteneklerini takas et. Güven ve şeffaflık üzerine inşa edilmiş ağımıza katılın.",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "EldenEle.pet — Paylaşım Ağı",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "EldenEle.pet — Türkiye'nin Paylaşım Platformu",
        description: "Takas yap, sahiplendir, bedelsiz hediye ver, yeteneklerini takas et.",
        images: ["/og-image.png"],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    alternates: {
        canonical: SITE_URL,
    },
    verification: {
        // google: 'YOUR_GOOGLE_VERIFICATION_CODE',
    },
    category: "marketplace",
};

export default function RootLayout({ children }) {
    const orgJsonLd = generateOrganizationJsonLd();
    const webSiteJsonLd = generateWebSiteJsonLd();

    return (
        <html lang="tr">
            <head>
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#1e293b" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

                {/* Organization JSON-LD */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
                />
                {/* WebSite JSON-LD (enables Google Sitelinks Search Box) */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
                />
            </head>
            <body className="antialiased">
                <AuthProvider>
                    <ProgressBarProvider>
                        <BotSimulator />
                        <LiveNotifications />
                        {children}
                    </ProgressBarProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
