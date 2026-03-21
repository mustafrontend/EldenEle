export const metadata = {
    title: 'Kayıt Ol — Ücretsiz Hesap Aç',
    description: 'EldenEle.pet yardımlaşma ağına katılın ve paylaşmaya başlayın. Eşya takası yapın, hayvan sahiplendirin, bedelsiz eşya verin veya yetenek takası yapın. Türkiye\'nin değer odaklı paylaşım platformuna hemen katılın.',
    keywords: ['kayıt ol', 'ücretsiz kayıt', 'eldenele kayıt', 'takas platformu kayıt'],
    robots: { index: true, follow: true },
    alternates: { canonical: 'https://eldenele.pet/kayit' },
    openGraph: {
        title: 'EldenEle.pet — Ücretsiz Kayıt Ol',
        description: 'Türkiye\'nin en büyük takas ve paylaşım platformuna katılın. Ücretsiz hesap açın.',
        type: 'website',
    },
};

export default function KayitLayout({ children }) {
    return children;
}
