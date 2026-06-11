const BaseProvider = require('./base');
const { getDoc, toAbsolute } = require('../utils/scraper');
const axios = require('axios');

class Akwam extends BaseProvider {
  constructor() {
    super();
    this.name = 'Akwam';
    this.baseUrl = 'https://ak.sv';
    this.catalogId = 'akwam';
  }

  async getCatalog(type, page = 1) {
    const path = type === 'movie' ? '/movies' : '/series';
    const url = page > 1
      ? `${this.baseUrl}${path}?page=${page}`
      : `${this.baseUrl}${path}`;

    const $ = await getDoc(url);
    const items = [];

    $('div.col-lg-auto.col-md-4.col-6').each((_, el) => {
      const a = $(el).find('h3.entry-title a');
      const title = a.text().trim();
      const href = $(el).find('a').first().attr('href');
      const poster = $(el).find('img').attr('data-src')
                 || $(el).find('img').attr('src');

      if (!title || !href) return;

      items.push({
        id: `akwam:${Buffer.from(href).toString('base64')}`,
        type,
        name: title,
        poster: poster || '',
      });
    });

    return items;
  }

  async search(query) {
    const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}`;
    const $ = await getDoc(url);
    const items = [];

    $('div.col-lg-auto.col-md-4.col-6').each((_, el) => {
      const a = $(el).find('h3.entry-title a');
      const title = a.text().trim();
      const href = $(el).find('a').first().attr('href');
      const poster = $(el).find('img').attr('data-src')
                 || $(el).find('img').attr('src');

      if (!title || !href) return;
      const type = href.includes('/movie/') ? 'movie' : 'series';

      items.push({
        id: `akwam:${Buffer.from(href).toString('base64')}`,
        type,
        name: title,
        poster: poster || '',
      });
    });

    return items;
  }

  async getMeta(encodedUrl) {
    const url = Buffer.from(encodedUrl, 'base64').toString();
    const $ = await getDoc(url);

    const title = $('h1').first().text().trim();
    const poster = $('.poster img').attr('data-src')
                || $('.poster img').attr('src');
    const description = $('.story p').first().text().trim();

    return { title, poster, description };
  }

  async getStreams(encodedUrl) {
    const pageUrl = Buffer.from(encodedUrl, 'base64').toString();
    const $ = await getDoc(pageUrl);

    const watchLink = $('a.link-show').attr('href');
    const pageId = $('input#page_id').attr('value');
    if (!watchLink || !pageId) return [];

    const watchUrl = `${this.baseUrl}/watch${watchLink.split('watch')[1]}/${pageId}`;
    const $w = await getDoc(watchUrl);

    const streams = [];
    $w('source[src]').each((_, el) => {
      const src = $w(el).attr('src');
      const label = $w(el).attr('size') || $w(el).attr('label') || 'Auto';
      if (src) {
        streams.push({
          name: `Akwam ${label}p`,
          title: label + 'p',
          url: src,
        });
      }
    });

    return streams;
  }
}

module.exports = Akwam;
