const axios = require('axios');

// رابط HuggingFace Space الخاص بك
const HF_URL = 'https://hfip-universal-scrapling-solver.hf.space';

/**
 * جلب HTML لأي موقع عبر StealthyFetcher (يتخطى Cloudflare)
 */
async function cfGet(url) {
  try {
    const res = await axios.post(
      `${HF_URL}/solve`,
      { url },
      { timeout: 60000 } // دقيقة كاملة لأن Playwright يأخذ وقت
    );
    if (res.data?.html) return res.data.html;
    throw new Error('No HTML returned');
  } catch (err) {
    console.warn(`[CF] HuggingFace failed, trying direct: ${err.message}`);
    // fallback مباشر بدون bypass
    const res = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'ar,en;q=0.9',
      },
      maxRedirects: 5, // ← يتبع الـ redirect تلقائياً
    });
    return res.data;
  }
}

/**
 * POST request عبر HuggingFace (للمواقع اللي تحتاج CSRF tokens)
 */
async function cfPost(url, formData) {
  // للـ POST نستخدم direct لأن HF لا يدعمه حالياً
  const res = await axios.post(url, new URLSearchParams(formData), {
    timeout: 15000,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  return res.data;
}

/**
 * Keep-alive: استدعيه مرة كل 25 دقيقة عشان HF ما ينام
 */
async function keepAlive() {
  try {
    await axios.get(`${HF_URL}/docs`, { timeout: 10000 });
    console.log('[CF] Keep-alive ping sent');
  } catch {}
}

// ping كل 25 دقيقة
setInterval(keepAlive, 25 * 60 * 1000);

module.exports = { cfGet, cfPost };
