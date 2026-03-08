import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Topluluk ve Talepler - EldenEle.app',
    description: 'EldenEle.app yardımlaşma ağında aklına takılanı topluluğa sor, hizmet ve yetenek taleplerini hızlıca oluştur veya diğerlerine yardım et.',
    openGraph: {
        title: 'Topluluk ve Talepler - EldenEle.app',
        description: 'EldenEle.app yardımlaşma ağında aklına takılanı topluluğa sor, hizmet ve yetenek taleplerini hızlıca oluştur.',
        url: 'https://eldenele.app/topluluk',
        siteName: 'EldenEle.app',
        locale: 'tr_TR',
        type: 'website',
    },
};

export default function ToplulukPage() {
    // Sadece /topluluk linkine tıklayanları direkt ana sayfadaki topluluk sekmesine (/?tab=community) yönlendirir.
    redirect('/?tab=community');
}
