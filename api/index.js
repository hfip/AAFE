const Akwam = require('../providers/akwam');
const ArabSeed = require('../providers/arabseed');

const akwamProvider = new Akwam();
const arabseedProvider = new ArabSeed();

const manifest = {
  id: 'community.arabic.addon',
  version: '1.0.0',
  name: 'Arabic Streams Addon',
  description: 'إضافة عربية لمشاهدة الأفلام والمسلسلات من أكوام وعرب سيد',
  resources: ['catalog', 'search', 'meta', 'stream'],
  types: ['movie', 'series'],
  idPrefixes: ['akwam:', 'arabseed:'],
  catalogs: [
    { type: 'movie', id: 'arabic_movies', name: 'أفلام عربية' },
    { type: 'series', id: 'arabic_series', name: 'مسلسلات عربية' }
  ]
};

module.exports = async (req, res) => {
  // تفعيل الـ CORS عشان تطبيق Stremio يقدر يقرا البيانات بدون حجب
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const urlPaths = req.url.split('/').filter(Boolean);

  // إذا طلب الرابط الرئيسي، ارجع الـ Manifest الخاص بالإضافة
  if (urlPaths.length === 0 || req.url === '/manifest.json') {
    return res.status(200).json(manifest);
  }

  try {
    // تحليل المسار (مثال: /catalog/movie/arabic_movies.json)
    const [resource, type, idWithJson] = urlPaths;
    const id = idWithJson ? idWithJson.replace('.json', '') : '';

    // 1. معالجة الـ Catalogs
    if (resource === 'catalog') {
      if (id === 'arabic_movies' || id === 'arabic_series') {
        const akwamItems = await akwamProvider.getCatalog(type).catch(() => []);
        const seedItems = await arabseedProvider.getCatalog(type).catch(() => []);
        return res.status(200).json({ catalogs: [...akwamItems, ...seedItems] });
      }
      return res.status(200).json({ catalogs: [] });
    }

    // 2. معالجة البحث
    if (resource === 'search') {
      const query = decodeURIComponent(type.replace('.json', ''));
      const akwamResults = await akwamProvider.search(query).catch(() => []);
      const seedResults = await arabseedProvider.search(query).catch(() => []);
      return res.status(200).json({ catalogs: [...akwamResults, ...seedResults] });
    }

    // 3. معالجة البيانات الوصفية (Meta)
    if (resource === 'meta') {
      const cleanId = decodeURIComponent(id);
      const [provider, encodedUrl] = cleanId.split(':');
      if (provider === 'akwam') {
        const meta = await akwamProvider.getMeta(encodedUrl).catch(() => null);
        return res.status(200).json({ meta: { id: cleanId, type, ...meta } });
      } else if (provider === 'arabseed') {
        return res.status(200).json({ meta: { id: cleanId, type, title: 'ArabSeed Video' } });
      }
      return res.status(200).json({ meta: null });
    }

    // 4. معالجة روابط التشغيل (Stream)
    if (resource === 'stream') {
      const cleanId = decodeURIComponent(id);
      const [provider, encodedUrl] = cleanId.split(':');
      if (provider === 'akwam') {
        const streams = await akwamProvider.getStreams(encodedUrl).catch(() => []);
        return res.status(200).json({ streams });
      } else if (provider === 'arabseed') {
        const streams = await arabseedProvider.getStreams(encodedUrl).catch(() => []);
        return res.status(200).json({ streams });
      }
      return res.status(200).json({ streams: [] });
    }

    return res.status(404).json({ error: 'Not Found' });
  } catch (error) {
    console.error('Stremio Addon Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};
