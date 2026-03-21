import { NextResponse } from 'next/server';

const OPENROUTER_API_KEY = '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';

export async function POST(req) {
    try {
        const { messages } = await req.json();

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://eldenele.pet", // Optional
                "X-Title": "EldenEle AI Assistant", // Optional
            },
            body: JSON.stringify({
                "model": "google/gemini-2.0-flash-001",
                "messages": [
                    {
                        "role": "system",
                        "content": `Sen EldenEle (.pet) platformunun akıllı asistanı 'PatiAI'sin. 
                        EldenEle, hayvan sahiplendirme, eş bulma, pati oteli, gezdirme, kayıp ilanı ve pati market hizmetleri sunan bir dayanışma ağıdır.
                        Senin görevin kullanıcılara hayvan bakımı, eğitimi, sağlığı ve platformun kullanımı hakkında yardımcı olmaktır.
                        
                        Kurallar:
                        1. Samimi, yardımsever ve hayvansever bir üslup kullan.
                        2. Yanıtların kısa, öz ve etkileşimli olsun.
                        3. Acil tıbbi durumlarda her zaman bir veteriner hekime başvurmalarını hatırlat.
                        4. Platform dışı ödemeler (kaparo vb.) konusunda kullanıcıları uyar.
                        5. Emoji kullanımını abartmadan yerinde yap (🐾, 🐶, 🐱, ✨ vb.).
                        
                        Yanıtlarını Türkçe dilinde ver.`
                    },
                    ...messages
                ],
            })
        });

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("AI Error:", error);
        return NextResponse.json({ error: "AI isteği başarısız oldu." }, { status: 500 });
    }
}
