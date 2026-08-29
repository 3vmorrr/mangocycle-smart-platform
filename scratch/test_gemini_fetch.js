const fs = require('fs');

let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey && fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf8');
  const match = content.match(/GEMINI_API_KEY=([^\r\n]+)/);
  if (match) apiKey = match[1].trim();
}

async function runTest() {
  console.log('Starting fetch to Gemini gemini-3.7-flash with 50s timeout...');
  const start = Date.now();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Hello, respond with valid JSON: {"status": "ok", "message": "hello"}' }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      }),
      signal: AbortSignal.timeout(50000)
    });
    const data = await res.json();
    console.log(`SUCCESS in ${Date.now() - start}ms! Status: ${res.status}`);
    console.log('Response content:', data.candidates?.[0]?.content?.parts?.[0]?.text);
  } catch (err) {
    console.error(`FAILED in ${Date.now() - start}ms:`, err.message);
  }
}

runTest();
