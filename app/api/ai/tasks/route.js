import { NextResponse } from 'next/server';

const OPENROUTER_API_KEY = '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';

export async function POST(req) {
    try {
        const { task, data } = await req.json();

        let systemPrompt = "";
        let userPrompt = "";

        if (task === 'generate-description') {
            systemPrompt = "Sen profesyonel bir evcil hayvan sahiplendirme metni yazarıyorsun. Kullanıcının verdiği kısa bilgileri duygusal, ilgi çekici ve güven veren, bol detaylı bir hikayeye dönüştür. Metin samimi olsun ama ciddiyeti korusun. Anahtar kelimeleri (aşı, yaş, huy) mutlaka vurgula.";
            userPrompt = `Şu bilgilerle harika bir ilan metni yaz: ${data.input}`;
        } else if (task === 'analyze-photo') {
            systemPrompt = `Sen uzman bir veteriner ve pet fotoğrafçılığı danışmanısın. 
            Görevin: Sana gönderilen evcil hayvan fotoğrafını hem medikal hem de görsel kalite açısından analiz etmek.
            
Output formatın SADECE şu JSON yapısında olmalı:
{
  "breed": "tahmin edilen ırk",
  "ageCategory": "yavru/yetişkin/yaşlı",
  "type": "kedi/köpek/diğer",
  "dominantColor": "renk",
  "healthStatus": "tüy yapısı, göz parlaması ve genel duruşa göre kısa sağlık notu",
  "qualityControl": {
    "score": 1-10 arası puan,
    "feedback": "Işık, netlik veya kompozisyon hakkında tavsiye (Örn: 'Fotoğraf biraz karanlık, gün ışığında çekersen daha hızlı yuva bulabilir.')"
  },
  "description": "kısa genel analiz"
}
            Yanıt sadece saf JSON olsun, Markdown bloğu içine alma.`;
        } else if (task === 'vet-triage') {
            systemPrompt = "Sen bir veteriner triyaj asistanısın. Kullanıcının belirttiği semptomlara göre durumun aciliyetini analiz et. Yanıtında şunları belirt: 1. Aciliyet Seviyesi (Yeşil/Sarı/Kırmızı), 2. Olası nedenler (not teşhis), 3. İlk yapılması gerekenler, 4. Kritik Uyarı (Veteriner hekime danışın).";
            userPrompt = `Semptom: ${data.symptoms}`;
        } else if (task === 'vet-compliment') {
            systemPrompt = "Sen sevgi dolu ve uzman bir veteriner hekimsin. Sana bilgileri verilen evcil hayvan ilanı hakkında, bir veteriner gözüyle çok kısa (maks 2 cümle), profesyonel ama çok sıcak bir iltifat yaz. Hayvanın ırkı veya özelliklerine vurgu yap. Hedef: İnsanları o hayvanı sahiplenmeye teşvik etmek.";
            userPrompt = `Hayvan Bilgileri: ${JSON.stringify(data.listing)}`;
        } else if (task === 'admin-webmaster') {
            systemPrompt = `Sen bir Kıdemli Webmaster ve SEO Uzmanısın. EldenEle platformunun tüm verilerine ve yönetici araçlarına hakimsin. 
            Görevin: Adminin sorularına teknik, stratejik ve SEO uyumlu yanıtlar vermek. 
            Yeteneklerin:
            1. Veri Analizi: Paylaşılan platform verilerinden (ziyaretçiler, ilanlar, mesajlar) rapor oluşturabilir, trendleri görebilirsin.
            2. SEO Denetimi: Platform genelinde SEO iyileştirme önerileri sunarsın.
            3. İçerik Üretimi: 'Sevimli Duyuru' oluşturman istendiğinde, dost canlısı, ikna edici ve SEO odaklı duyuru metinleri yazarsın.
            4. Teknik Destek: Tüm metodları ve sistem araçlarını bilirsin.
            Yanıtların profesyonel, vizyoner ve uygulama odaklı olmalı.`;
            userPrompt = `Veriler/Soru: ${JSON.stringify(data.context)}`;
        } else if (task === 'format-news-html') {
            systemPrompt = `Sen profesyonel bir İçerik Editörü ve HTML Tasarımcısısın. 
            Görevin: Kullanıcının verdiği ham metni, EldenEle platformu için göz alıcı, profesyonel ve SEO uyumlu bir HTML duyuru metnine dönüştürmek.
            Kurallar:
            1. Sadece <b>, <i>, <u>, <h3>, <ul>, <li> etiketlerini kullan.
            2. Önemli kısımları <b> ile vurgula.
            3. Metne uygun yerlere emojiler ekle.
            4. Profesyonel, samimi ve ikna edici bir dil kullan.
            5. Yanıt olarak SADECE saf HTML kodunu döndür, başka açıklama yazma.`;
            userPrompt = `Bu metni harika bir HTML duyuruya dönüştür: ${data.input}`;
        } else if (task === 'verify-human-profile') {
            systemPrompt = `Sen bir Güvenlik ve Kimlik Doğrulama asistanısın. 
            Görevin: Sana gönderilen profil fotoğrafının gerçek bir insana ait olup olmadığını analiz etmek.
            Kurallar:
            1. Fotoğrafta net bir insan yüzü olmalı.
            2. Karikatür, hayvan, manzara veya nesne fotoğrafları geçersizdir.
            3. Yanıtın SADECE şu JSON formatında olmalı: {"isHuman": true/false, "reason": "neden (Türkçe)"}
            Yanıt sadece saf JSON olsun.`;
        }

        const body = {
            "model": "google/gemini-2.0-flash-001",
            "messages": [
                { "role": "system", "content": systemPrompt },
                {
                    "role": "user", "content": (task === 'analyze-photo' || task === 'verify-human-profile') ? [
                        { "type": "text", "text": task === 'analyze-photo' ? "Bu hayvanı analiz et." : "Bu profil fotoğrafını doğrula." },
                        { "type": "image_url", "image_url": { "url": data.imageBase64 } }
                    ] : userPrompt
                }
            ]
        };

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const result = await response.json();
        return NextResponse.json(result);

    } catch (error) {
        console.error("AI Task Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
