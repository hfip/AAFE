const axios = require('axios');

// ← ضع رابط HuggingFace Space الخاص بك هنا
const HF_URL = 'https://YOUR-SPACE.hf.space';

async function cfGet(url) {
  try {
    const res = await axios.post(`${HF_URL}/fetch`, { url });
    return res.data.html;
  } catch {
    // fallback: طلب مباشر بدون bypass
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    return res.data;
  }
}

module.exports = { cfGet };
