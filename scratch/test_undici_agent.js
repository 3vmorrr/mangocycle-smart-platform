const fs = require('fs');

let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey && fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf8');
  const match = content.match(/GEMINI_API_KEY=([^\r\n]+)/);
  if (match) apiKey = match[1].trim();
}

async function testWithAgent() {
  const { Agent, setGlobalDispatcher } = require('undici');
  
  const agent = new Agent({
    connect: {
      timeout: 30000,
    }
  });
  setGlobalDispatcher(agent);

  console.log('Testing with custom undici Agent...');
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
            parts: [{ text: 'Hello, respond with valid JSON: {"status": "ok"}' }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });
    const data = await res.json();
    console.log(`SUCCESS in ${Date.now() - start}ms! Status: ${res.status}`);
    console.log('Response content:', data.candidates?.[0]?.content?.parts?.[0]?.text);
  } catch (err) {
    console.error(`FAILED in ${Date.now() - start}ms:`, err.message);
  }
}

testWithAgent();
