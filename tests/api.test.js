// Usar banco em memória para os testes
process.env.DB_PATH = ':memory:';

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/database');

// Limpa as tabelas antes de cada teste
beforeEach(() => {
  db.exec('DELETE FROM clicks');
  db.exec('DELETE FROM urls');
});

afterAll(() => {
  db.close();
});

describe('GET /api/info', () => {
  test('deve retornar info da API com stats', async () => {
    const res = await request(app).get('/api/info');

    expect(res.status).toBe(200);
    expect(res.body.name).toContain('URL Shortener');
    expect(res.body.stats).toHaveProperty('total_urls', 0);
    expect(res.body.stats).toHaveProperty('total_clicks', 0);
    expect(res.body.endpoints).toBeDefined();
  });
});

describe('POST /api/shorten', () => {
  test('deve encurtar uma URL com alias customizado', async () => {
    const res = await request(app)
      .post('/api/shorten')
      .send({ url: 'https://github.com', custom_alias: 'gh' });

    expect(res.status).toBe(201);
    expect(res.body.original_url).toBe('https://github.com');
    expect(res.body.short_code).toBe('gh');
    expect(res.body.short_url).toContain('/gh');
    expect(res.body.id).toBeDefined();
    expect(res.body.created_at).toBeDefined();
  });

  test('deve encurtar uma URL com código aleatório', async () => {
    const res = await request(app)
      .post('/api/shorten')
      .send({ url: 'https://google.com' });

    expect(res.status).toBe(201);
    expect(res.body.short_code).toHaveLength(7);
    expect(res.body.original_url).toBe('https://google.com');
  });

  test('deve rejeitar sem campo url', async () => {
    const res = await request(app)
      .post('/api/shorten')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('obrigatório');
  });

  test('deve rejeitar URL inválida', async () => {
    const res = await request(app)
      .post('/api/shorten')
      .send({ url: 'nao-e-uma-url' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('inválida');
  });

  test('deve rejeitar alias duplicado', async () => {
    await request(app)
      .post('/api/shorten')
      .send({ url: 'https://github.com', custom_alias: 'myalias' });

    const res = await request(app)
      .post('/api/shorten')
      .send({ url: 'https://google.com', custom_alias: 'myalias' });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('já está em uso');
  });

  test('deve rejeitar alias com caracteres inválidos', async () => {
    const res = await request(app)
      .post('/api/shorten')
      .send({ url: 'https://github.com', custom_alias: 'meu alias!' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Alias');
  });
});

describe('GET /api/urls', () => {
  test('deve retornar lista vazia inicialmente', async () => {
    const res = await request(app).get('/api/urls');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
  });

  test('deve listar URLs criadas com paginação', async () => {
    // Criar 3 URLs
    await request(app).post('/api/shorten').send({ url: 'https://a.com', custom_alias: 'a' });
    await request(app).post('/api/shorten').send({ url: 'https://b.com', custom_alias: 'b' });
    await request(app).post('/api/shorten').send({ url: 'https://c.com', custom_alias: 'c' });

    const res = await request(app).get('/api/urls?page=1&limit=2');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.total).toBe(3);
    expect(res.body.pagination.total_pages).toBe(2);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(2);
  });
});

describe('GET /api/urls/:code/stats', () => {
  test('deve retornar stats de uma URL existente', async () => {
    await request(app)
      .post('/api/shorten')
      .send({ url: 'https://github.com', custom_alias: 'stats-test' });

    const res = await request(app).get('/api/urls/stats-test/stats');

    expect(res.status).toBe(200);
    expect(res.body.original_url).toBe('https://github.com');
    expect(res.body.short_code).toBe('stats-test');
    expect(res.body.total_clicks).toBe(0);
    expect(res.body.clicks_by_day).toEqual([]);
    expect(res.body.recent_clicks).toEqual([]);
  });

  test('deve retornar 404 para código inexistente', async () => {
    const res = await request(app).get('/api/urls/naoexiste/stats');

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('não encontrada');
  });
});

describe('DELETE /api/urls/:code', () => {
  test('deve deletar uma URL existente', async () => {
    await request(app)
      .post('/api/shorten')
      .send({ url: 'https://delete-me.com', custom_alias: 'deletar' });

    const res = await request(app).delete('/api/urls/deletar');
    expect(res.status).toBe(204);

    // Confirmar que foi deletada
    const check = await request(app).get('/api/urls/deletar/stats');
    expect(check.status).toBe(404);
  });

  test('deve retornar 404 ao deletar código inexistente', async () => {
    const res = await request(app).delete('/api/urls/naoexiste');
    expect(res.status).toBe(404);
  });
});

describe('GET /:code (redirect)', () => {
  test('deve redirecionar 301 para a URL original', async () => {
    await request(app)
      .post('/api/shorten')
      .send({ url: 'https://youtube.com', custom_alias: 'yt' });

    const res = await request(app).get('/yt').redirects(0);

    expect(res.status).toBe(301);
    expect(res.headers.location).toBe('https://youtube.com');
  });

  test('deve registrar o clique ao redirecionar', async () => {
    await request(app)
      .post('/api/shorten')
      .send({ url: 'https://youtube.com', custom_alias: 'click-test' });

    // Fazer o redirect
    await request(app).get('/click-test').redirects(0);
    await request(app).get('/click-test').redirects(0);

    // Verificar se os cliques foram registrados
    const stats = await request(app).get('/api/urls/click-test/stats');
    expect(stats.body.total_clicks).toBe(2);
    expect(stats.body.recent_clicks).toHaveLength(2);
  });

  test('deve retornar 404 para código inexistente', async () => {
    const res = await request(app).get('/naoexiste123');
    expect(res.status).toBe(404);
  });
});
