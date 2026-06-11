const { addonInterface, serveHTTP } = require('stremio-addon-sdk');
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

const builder = new addonInterface(manifest);

// 1. معالجة الـ Catalogs (القائمة الرئيسية)
builder.defineCatalogHandler(async (args) => {
  if (args.id === 'arabic_movies' || args.id === 'arabic_series') {
    const type = args.type; // movie أو series
    const akwamItems = await akwamProvider.getCatalog(type);
    const seedItems = await arabseedProvider.getCatalog(type);
    return { catalogs: [...akwamItems, ...seedItems] };
  }
  return { catalogs: [] };
});

// 2. معالجة البحث (Search)
builder.defineSearchHandler(async (args) => {
  const query = args.query;
  const akwamResults = await akwamProvider.search(query);
  const seedResults = await arabseedProvider.search(query);
  return { catalogs: [...akwamResults, ...seedResults] };
});

// 3. معالجة البيانات الوصفية (Meta)
builder.defineMetaHandler(async (args) => {
  const [provider, encodedUrl] = args.id.split(':');
  if (provider === 'akwam') {
    const meta = await akwamProvider.getMeta(encodedUrl);
    return { meta: { id: args.id, type: args.type, ...meta } };
  } else if (provider === 'arabseed') {
    // يمكنك إضافة دالة getMeta لعرب سيد بنفس طريقة أكوام لاحقاً إذا أردت
    return { meta: { id: args.id, type: args.type, title: 'ArabSeed Video' } };
  }
  return { meta: null };
});

// 4. معالجة روابط التشغيل (Streams)
builder.defineStreamHandler(async (args) => {
  const [provider, encodedUrl] = args.id.split(':');
  if (provider === 'akwam') {
    const streams = await akwamProvider.getStreams(encodedUrl);
    return { streams };
  } else if (provider === 'arabseed') {
    const streams = await arabseedProvider.getStreams(encodedUrl);
    return { streams };
  }
  return { streams: [] };
});

// التوافق مع رفع Vercel كدالة Serverless
module.exports = (req, res) => {
  const createServer = serveHTTP(builder.getInterface(), { path: '/' });
  createServer(req, res);
};
