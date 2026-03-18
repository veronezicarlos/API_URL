const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const db = require('./database');
const urlRoutes = require('./routes/urls');

const app = express();

// ── Middlewares ──────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rate limiter: máximo 100 requests por minuto por IP
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
}));

// ── Rotas da API ─────────────────────────────────
app.use('/api', urlRoutes);

// ── Redirect: GET /:code ─────────────────────────
app.get('/:code', (req, res) => {
  const shortCode = req.params.code;

  if (!/^[a-zA-Z0-9_-]+$/.test(shortCode)) {
    return res.status(400).json({ error: 'Código inválido.' });
  }

  const url = db.prepare('SELECT * FROM urls WHERE short_code = ?').get(shortCode);

  if (!url) {
    return res.status(404).json({ error: 'URL não encontrada.' });
  }

  // Registra o clique
  db.prepare('UPDATE urls SET clicks = clicks + 1 WHERE id = ?').run(url.id);
  db.prepare(
    'INSERT INTO clicks (url_id, ip, user_agent, referer) VALUES (?, ?, ?, ?)'
  ).run(
    url.id,
    req.ip,
    req.get('user-agent') || null,
    req.get('referer') || null
  );

  res.redirect(301, url.original_url);
});

module.exports = app;
