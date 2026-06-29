const fs = require('fs');
const path = require('path');

// Load GEMINI_API_KEY securely from environment or .env.local
let API_KEY = process.env.GEMINI_API_KEY;

try {
  const envPath = path.join(__dirname, '../.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      if (key === 'GEMINI_API_KEY') {
        API_KEY = value;
      }
    }
  });
} catch (e) {
  // Fail silently and fallback to process.env
}

if (!API_KEY) {
  console.error("Error: GEMINI_API_KEY is not defined in environment variables or .env.local");
  process.exit(1);
}

const models = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-2.0-flash",
  "gemini-2.0-flash-exp",
  "gemini-2.5-flash",
  "gemini-2-flash",
  "gemini-flash-latest"
];

async function testModel(model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hi" }] }]
      })
    });
    const status = res.status;
    const body = await res.text();
    console.log(`Model: ${model} -> Status: ${status}`);
    if (status === 200) {
      console.log(`SUCCESS for ${model}!`);
      return true;
    } else {
      console.log(`Response: ${body.substring(0, 150)}...`);
    }
  } catch (err) {
    console.log(`Error testing ${model}:`, err.message);
  }
  return false;
}

async function run() {
  for (const model of models) {
    console.log(`Testing ${model}...`);
    const success = await testModel(model);
    if (success) {
      console.log(`Found working model: ${model}`);
    }
    console.log("------------------------");
  }
}

run();
