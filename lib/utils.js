/**
 * Telefon numarasını WhatsApp API'sinin beklediği formata (905XXXXXXXXX) dönüştürür.
 */
export function normalizePhoneForWhatsApp(phone) {
    if (!phone) return '';
    // Tüm boşlukları ve rakam dışı her şeyi sil
    let clean = phone.toString().replace(/\s+/g, '').replace(/\D/g, '');

    // Çift sıfırla başlıyorsa (0090...) baştaki 00'ı sil
    if (clean.startsWith('00')) clean = clean.substring(2);

    // Tek sıfırla başlıyorsa (05xx...) baştaki 0'ı sil
    if (clean.startsWith('0')) clean = clean.substring(1);

    // Eğer 10 hane kaldıysa (5xx...), TR ülke kodunu ekle
    if (clean.length === 10) return '90' + clean;

    // Eğer 12 hane ise ve 90 ile başlıyorsa zaten hazırdır
    if (clean.length === 12 && clean.startsWith('90')) return clean;

    // Diğer durumlarda TR varsayıp 90 ekle (eğer 90 ile başlamıyorsa)
    const result = clean.startsWith('90') ? clean : '90' + clean;
    return result.replace(/\s+/g, ''); // Garanti olsun
}

/**
 * Telefon numarasını kullanıcıya şık bir şekilde (0 5XX XXX XX XX) göstermek için formatlar.
 */
export function formatPhoneForDisplay(phone) {
    if (!phone) return '';
    let clean = phone.replace(/\D/g, '');

    // Baştaki 0090 veya 90 veya 0'ı temizleyip ana 10 haneye odaklanalım
    if (clean.startsWith('0090')) clean = clean.substring(4);
    else if (clean.startsWith('90')) clean = clean.substring(2);
    else if (clean.startsWith('0')) clean = clean.substring(1);

    if (clean.length !== 10) return phone; // Formatlanamıyorsa orijinali dön

    return `0 (${clean.substring(0, 3)}) ${clean.substring(3, 6)} ${clean.substring(6, 8)} ${clean.substring(8, 10)}`;
}
