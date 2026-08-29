const https = require('https');
const fs = require('fs');

let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey && fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf8');
  const match = content.match(/GEMINI_API_KEY=([^\r\n]+)/);
  if (match) apiKey = match[1].trim();
}

function callGeminiHttps(model, payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 30000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.write(postData);
    req.end();
  });
}

(async () => {
  console.log('Testing gemini-3.7-flash with Node https module...');
  const start = Date.now();
  try {
    const res = await callGeminiHttps('gemini-3.7-flash', {
      contents: [{ role: 'user', parts: [{ text: 'Hello, respond with short JSON: {"status":"ok"}' }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });
    console.log(`HTTP ${res.status} in ${Date.now() - start}ms:`, res.body.substring(0, 200));
  } catch (err) {
    console.error(`Error in ${Date.now() - start}ms:`, err.message);
  }
})();
