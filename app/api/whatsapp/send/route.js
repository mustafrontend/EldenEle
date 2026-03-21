import { NextResponse } from 'next/server';

const ULTRAMSG_INSTANCE = 'instance165307';
const ULTRAMSG_TOKEN = 'nr8o0qxv6dsqijmy';
const ULTRAMSG_URL = `https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`;

export async function POST(request) {
    try {
        const { to, body } = await request.json();

        if (!to || !body) {
            return NextResponse.json({ success: false, error: 'Phone and body are required' }, { status: 400 });
        }

        // Format to +90...
        let cleanPhone = to.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.slice(1);
        if (!cleanPhone.startsWith('90')) cleanPhone = '90' + cleanPhone;
        const finalPhone = '+' + cleanPhone;

        const urlencoded = new URLSearchParams();
        urlencoded.append("token", ULTRAMSG_TOKEN);
        urlencoded.append("to", finalPhone);
        urlencoded.append("body", body);
        urlencoded.append("priority", "10");

        const response = await fetch(ULTRAMSG_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: urlencoded,
            redirect: 'follow'
        });

        const result = await response.text();
        return NextResponse.json({ success: true, result });

    } catch (error) {
        console.error("WhatsApp Send API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
