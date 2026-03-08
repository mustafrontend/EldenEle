export const metadata = {
    title: 'Kayıt Ol — Ücretsiz Hesap Aç',
    description: 'EldenEle.app\'e ücretsiz kayıt olun! Eşya takası yapın, hayvan sahiplendirin, bedelsiz eşya verin veya yetenek takası yapın. Türkiye\'nin değer odaklı paylaşım platformuna hemen katılın.',
    keywords: ['kayıt ol', 'ücretsiz kayıt', 'eldenele kayıt', 'takas platformu kayıt'],
    robots: { index: true, follow: true },
    alternates: { canonical: 'https://eldenele.app/kayit' },
    openGraph: {
        title: 'EldenEle.app — Ücretsiz Kayıt Ol',
        description: 'Türkiye\'nin en büyük takas ve paylaşım platformuna katılın. Ücretsiz hesap açın.',
        type: 'website',
    },
};

export default function KayitLayout({ children }) {
    return children;
}
