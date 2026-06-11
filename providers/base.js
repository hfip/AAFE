class BaseProvider {
  constructor() {
    this.name = '';
    this.baseUrl = '';
    this.lang = 'ar';
  }

  // كل provider يطبّق هذي الدوال
  async getCatalog(type, page) { return []; }
  async search(query) { return []; }
  async getMeta(id) { return null; }
  async getStreams(id) { return []; }
}

module.exports = BaseProvider;
