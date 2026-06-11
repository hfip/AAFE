const cheerio = require('cheerio');
const { cfGet } = require('./cloudflare');

async function getDoc(url) {
  const html = await cfGet(url);
  return cheerio.load(html);
}

function toAbsolute(url, base) {
  if (!url || url.trim() === '') return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('//')) return 'https:' + url;
  return base.replace(/\/$/, '') + url;
}

module.exports = { getDoc, toAbsolute };
