const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');

// استيراد كل المصادر
const Akwam    = require('../providers/akwam');
const ArabSeed = require('../providers/arabseed');
const FaselHD  = require('../providers/faselhd');

const providers = [
  new Akwam(),
  new ArabSeed(),
  new FaselHD(),
];

// ── Manifest ──────────────────────────────────────────────
const manifest = {
  id: 'com.arabic.addon',
  version: '1.0.0',
  name: '🎬 Arabic Addon',
  description: 'أفلام ومسلسلات عربية — ArabSeed + Akwam + FaselHD',
  logo: 'https://i.imgur.com/xxxxxx.png', // ← غيّر الصورة
  resources: ['catalog', 'stream', 'meta'],
  types: ['movie', 'series'],
  idPrefixes: ['akwam:', 'arabseed:', 'faselhd:'],
  catalogs: [
    // Akwam
    { type: 'movie',  id: 'akwam_movies',  name: '🎬 Akwam أفلام' },
    { type: 'series', id: 'akwam_series',  name: '📺 Akwam مسلسلات' },
    // ArabSeed
    { type: 'movie',  id: 'arabseed_movies',  name: '🎬 ArabSeed أفلام' },
    { type: 'series', id: 'arabseed_series',  name: '📺 ArabSeed مسلسلات' },
    // FaselHD
    { type: 'movie',  id: 'faselhd_movies',  name: '🎬 FaselHD أفلام' },
    { type: 'series', id: 'faselhd_series',  name: '📺 FaselHD مسلسلات' },
  ],
};

const builder = new addonBuilder(manifest);

// ── Catalog Handler ────────────────────────────────────────
builder.defineCatalogHandler(async ({ type, id, extra }) => {
  const page = extra?.skip ? Math.floor(extra.skip / 20) + 1 : 1;
  const [providerName] = id.split('_');

  const provider = providers.find(p => p.catalogId === providerName);
  if (!provider) return { metas: [] };

  try {
    const metas = await provider.getCatalog(type, page);
    return { metas };
  } catch (e) {
    console.error(`Catalog error [${id}]:`, e.message);
    return { metas: [] };
  }
});

// ── Stream Handler ─────────────────────────────────────────
builder.defineStreamHandler(async ({ type, id }) => {
  // id مثل: akwam:BASE64URL
  const [providerName, encodedUrl] = id.split(':');
  const provider = providers.find(p => p.catalogId === providerName);
  if (!provider) return { streams: [] };

  try {
    const streams = await provider.getStreams(encodedUrl);
    return { streams };
  } catch (e) {
    console.error(`Stream error [${id}]:`, e.message);
    return { streams: [] };
  }
});

// ── Meta Handler ───────────────────────────────────────────
builder.defineMetaHandler(async ({ type, id }) => {
  const [providerName, encodedUrl] = id.split(':');
  const provider = providers.find(p => p.catalogId === providerName);
  if (!provider) return { meta: null };

  try {
    const meta = await provider.getMeta(encodedUrl);
    return { meta: { ...meta, id, type } };
  } catch {
    return { meta: null };
  }
});

// ── تشغيل Vercel ───────────────────────────────────────────
module.exports = (req, res) => {
  const addonInterface = builder.getInterface();
  serveHTTP(addonInterface, { port: 3000 });
};
