const fs = require('fs');

let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey && fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf8');
  const match = content.match(/GEMINI_API_KEY=([^\r\n]+)/);
  if (match) apiKey = match[1].trim();
}

async function testWithLongTimeout() {
  console.log('Testing gemini-3.7-flash with 60s timeout...');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Hello, respond with valid JSON: {"test": "success"}' }]
          }
        ],
        generationConfig: { responseMimeType: 'application/json' }
      }),
      signal: AbortSignal.timeout(60000)
    });
    const data = await res.json();
    console.log(`HTTP ${res.status} in ${Date.now() - start}ms:`, JSON.stringify(data));
  } catch (err) {
    console.error(`Error in ${Date.now() - start}ms:`, err.message);
  }
}

testWithLongTimeout();
