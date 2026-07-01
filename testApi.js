require('dotenv').config();

async function run() {
  try {
    const res = await fetch('http://localhost:5001/api/ai/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: "프린터 고장" })
    });
    
    if (!res.ok) {
        console.error("HTTP ERROR:", res.status, await res.text());
        return;
    }
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}
run();
