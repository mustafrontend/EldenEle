import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Topluluk ve Talepler - EldenEle.pet',
    description: 'EldenEle.pet yardımlaşma ağında aklına takılanı topluluğa sor, hizmet ve yetenek taleplerini hızlıca oluştur veya diğerlerine yardım et.',
    openGraph: {
        title: 'Topluluk ve Talepler - EldenEle.pet',
        description: 'EldenEle.pet yardımlaşma ağında aklına takılanı topluluğa sor, hizmet ve yetenek taleplerini hızlıca oluştur.',
        url: 'https://eldenele.pet/topluluk',
        siteName: 'EldenEle.pet',
        locale: 'tr_TR',
        type: 'website',
    },
};

export default function ToplulukPage() {
    // Sadece /topluluk linkine tıklayanları direkt ana sayfadaki topluluk sekmesine (/?tab=community) yönlendirir.
    redirect('/?tab=community');
}
