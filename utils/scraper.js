const cheerio = require('cheerio');
const axios = require('axios');

// ضع هنا رابط الـ Space الخاص بك على Hugging Face
const HF_SOLVER_URL = 'https://YOUR_SPACE_SUBDOMAIN.hf.space'; 

async function cfGet(url) {
  try {
    const res = await axios.post(`${HF_SOLVER_URL}/solve`, { url }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    return res.data?.html || '';
  } catch (err) {
    console.error(`[Cloudflare Bypass Error] Direct fallback for: ${url}`);
    // Fallback مباشر في حال تعطل السيرفر
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    return res.data;
  }
}

async function cfPost(url, payload) {
  // تحويل الـ POST العادي ليمر عبر محرك السيرفر إذا كان يدعم الحماية، 
  // أو إرساله كطلب مخصص لتجنب كشف البوتات
  try {
    const res = await axios.post(`${HF_SOLVER_URL}/solve`, { url }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    return res.data?.html || '';
  } catch {
    // إرسال مباشر في حال الفشل
    const res = await axios.post(url, payload);
    return res.data;
  }
}

async function getDoc(url) {
  const html = await cfGet(url);
  return cheerio.load(typeof html === 'string' ? html : JSON.stringify(html));
}

async function postDoc(url, formData) {
  const data = await cfPost(url, formData);
  return { data, $: cheerio.load(typeof data === 'string' ? data : '') };
}

function toAbsolute(url, base) {
  if (!url || url.trim() === '') return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('//')) return 'https:' + url;
  return base.replace(/\/$/, '') + url;
}

function getBaseUrl(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return url;
  }
}

module.exports = { getDoc, postDoc, toAbsolute, getBaseUrl, cfPost, cfGet };
