const { Router } = require('express');
const { nanoid } = require('nanoid');
const db = require('../database');

const router = Router();

// POST /api/shorten — Encurtar uma URL
router.post('/shorten', (req, res) => {
  const { url, custom_alias } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'O campo "url" é obrigatório.' });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'URL inválida.' });
  }

  const shortCode = custom_alias || nanoid(7);

  if (!/^[a-zA-Z0-9_-]+$/.test(shortCode)) {
    return res.status(400).json({ error: 'Alias só pode conter letras, números, - e _.' });
  }

  const existing = db.prepare('SELECT id FROM urls WHERE short_code = ?').get(shortCode);
  if (existing) {
    return res.status(409).json({ error: 'Esse alias já está em uso.' });
  }

  const result = db.prepare(
    'INSERT INTO urls (original_url, short_code) VALUES (?, ?)'
  ).run(url, shortCode);

  const created = db.prepare('SELECT * FROM urls WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({
    id: created.id,
    original_url: created.original_url,
    short_url: `${req.protocol}://${req.get('host')}/${created.short_code}`,
    short_code: created.short_code,
    created_at: created.created_at,
  });
});

// GET /api/urls — Listar todas as URLs encurtadas
router.get('/urls', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  const total = db.prepare('SELECT COUNT(*) as count FROM urls').get().count;
  const urls = db.prepare(
    'SELECT * FROM urls ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(limit, offset);

  res.json({
    data: urls.map(u => ({
      ...u,
      short_url: `${req.protocol}://${req.get('host')}/${u.short_code}`,
    })),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// GET /api/urls/:code/stats — Estatísticas detalhadas de uma URL
router.get('/urls/:code/stats', (req, res) => {
  const url = db.prepare('SELECT * FROM urls WHERE short_code = ?').get(req.params.code);

  if (!url) {
    return res.status(404).json({ error: 'URL não encontrada.' });
  }

  const recentClicks = db.prepare(
    'SELECT clicked_at, ip, user_agent, referer FROM clicks WHERE url_id = ? ORDER BY clicked_at DESC LIMIT 20'
  ).all(url.id);

  const clicksByDay = db.prepare(`
    SELECT date(clicked_at) as day, COUNT(*) as count
    FROM clicks WHERE url_id = ?
    GROUP BY day ORDER BY day DESC LIMIT 30
  `).all(url.id);

  res.json({
    id: url.id,
    original_url: url.original_url,
    short_code: url.short_code,
    short_url: `${req.protocol}://${req.get('host')}/${url.short_code}`,
    created_at: url.created_at,
    total_clicks: url.clicks,
    clicks_by_day: clicksByDay,
    recent_clicks: recentClicks,
  });
});

// GET /api/info — Informações e stats gerais
router.get('/info', (req, res) => {
  const totalUrls = db.prepare('SELECT COUNT(*) as count FROM urls').get().count;
  const totalClicks = db.prepare('SELECT COALESCE(SUM(clicks), 0) as count FROM urls').get().count;

  res.json({
    name: '🔗 URL Shortener API',
    version: '1.0.0',
    stats: { total_urls: totalUrls, total_clicks: totalClicks },
    endpoints: {
      'POST /api/shorten': 'Encurtar uma URL (body: { url, custom_alias? })',
      'GET /api/urls': 'Listar URLs (query: page, limit)',
      'GET /api/urls/:code/stats': 'Estatísticas de uma URL',
      'DELETE /api/urls/:code': 'Deletar uma URL',
      'GET /:code': 'Redirecionar para a URL original',
    },
  });
});

// DELETE /api/urls/:code — Deletar uma URL encurtada
router.delete('/urls/:code', (req, res) => {
  const url = db.prepare('SELECT id FROM urls WHERE short_code = ?').get(req.params.code);

  if (!url) {
    return res.status(404).json({ error: 'URL não encontrada.' });
  }

  db.prepare('DELETE FROM urls WHERE id = ?').run(url.id);
  res.status(204).end();
});

module.exports = router;
