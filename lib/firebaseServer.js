// Server-side Firestore utility — uses REST API, no Admin SDK needed
// Works in Next.js Server Components and generateMetadata

const PROJECT_ID = 'bardbird-8d5e4';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function parseFirestoreValue(val) {
    if (val.stringValue !== undefined) return val.stringValue;
    if (val.integerValue !== undefined) return Number(val.integerValue);
    if (val.doubleValue !== undefined) return val.doubleValue;
    if (val.booleanValue !== undefined) return val.booleanValue;
    if (val.timestampValue !== undefined) {
        const d = new Date(val.timestampValue);
        return { seconds: Math.floor(d.getTime() / 1000) };
    }
    if (val.arrayValue !== undefined) {
        return (val.arrayValue.values || []).map(parseFirestoreValue);
    }
    if (val.mapValue !== undefined) {
        return parseFirestoreDoc(val.mapValue.fields || {});
    }
    if (val.nullValue !== undefined) return null;
    return null;
}

function parseFirestoreDoc(fields) {
    const obj = {};
    for (const [key, val] of Object.entries(fields)) {
        obj[key] = parseFirestoreValue(val);
    }
    return obj;
}

/**
 * Fetch a single listing by Firestore document ID
 */
export async function getListingServer(id) {
    try {
        const res = await fetch(`${BASE_URL}/listings/${id}`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        const doc = await res.json();
        if (!doc.fields) return null;
        const name = doc.name.split('/').pop();
        return { id: name, ...parseFirestoreDoc(doc.fields) };
    } catch {
        return null;
    }
}

/**
 * Fetch all listings — for sitemap generation
 */
export async function getAllListingsServer() {
    try {
        const res = await fetch(`${BASE_URL}/listings?pageSize=500`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return [];
        const data = await res.json();
        if (!data.documents) return [];
        return data.documents.map(doc => {
            const id = doc.name.split('/').pop();
            return { id, ...parseFirestoreDoc(doc.fields) };
        });
    } catch {
        return [];
    }
}
