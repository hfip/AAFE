const cheerio = require('cheerio');
const { cfGet, cfPost } = require('./cloudflare');

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

// استخراج Base URL من أي رابط (يحل مشكلة الـ redirect)
function getBaseUrl(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return url;
  }
}

module.exports = { getDoc, postDoc, toAbsolute, getBaseUrl };
