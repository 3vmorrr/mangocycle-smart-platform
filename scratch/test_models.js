const fs = require('fs');

let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey && fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf8');
  const match = content.match(/GEMINI_API_KEY=([^\r\n]+)/);
  if (match) apiKey = match[1].trim();
}

const models = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.7-flash'
];

async function testSingle(model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  console.log(`\nTesting ${model}...`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Hello, respond with JSON: {"status":"ok"}' }]
          }
        ]
      })
    });
    const text = await res.text();
    console.log(`-> HTTP ${res.status}:`, text.substring(0, 200));
    return res.status === 200;
  } catch (err) {
    console.error(`-> Fetch error for ${model}:`, err.message, err.cause || '');
    return false;
  }
}

(async () => {
  for (const m of models) {
    const ok = await testSingle(m);
    if (ok) {
      console.log(`\n>>> Model ${m} is WORKING! <<<`);
      break;
    }
  }
})();
