const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const SEARXNG_URL = process.env.SEARXNG_URL || 'http://searxng:8080';
app.use(express.static(__dirname));
app.get('/api/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.status(400).json({ error: 'Поисковый запрос пуст.' });
    const count = Math.min(20, Math.max(1, Number(req.query.count) || 10));
    const url = new URL('/search', SEARXNG_URL);
    url.searchParams.set('q', q);
    url.searchParams.set('format', 'json');
    url.searchParams.set('language', 'en');
    url.searchParams.set('safesearch', '1');
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json({ error: body.message || `SearXNG вернул HTTP ${response.status}` });
    const results = (body.results || []).slice(0, count).map(x => ({
      title: x.title || x.url || 'Без заголовка',
      url: x.url || '',
      description: x.content || '',
      profile: { long_name: x.pretty_url || x.engine || '' }
    }));
    res.set('Cache-Control', 'no-store');
    res.json({ web: { results } });
  } catch (e) {
    res.status(502).json({ error: 'Сервер Prospector работает, но не отвечает поисковый движок SearXNG. Проверьте Docker Compose и статус контейнера searxng. Техническая причина: ' + e.message });
  }
});
app.listen(PORT, () => console.log(`Mining Prospector running on port ${PORT}`));
