const PROJECT_ID = 'bardbird-8d5e4';
async function test() {
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/listings/f9Wu4q1HIrKPwu6361Pd`);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}
test();
