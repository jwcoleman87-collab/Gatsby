const { coinspotPost } = require('./_auth');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.COINSPOT_API_KEY;
  const secret = process.env.COINSPOT_API_SECRET;
  if (!key || !secret) return res.status(500).json({ error: 'API keys not configured' });

  try {
    const data = await coinspotPost('/api/v2/ro/my/orders/completed', key, secret, {
      limit: 50,
    });

    if (data.status !== 'ok') return res.status(400).json({ error: data.message || 'Error', raw: data });

    const orders = (data.buyorders || []).concat(data.sellorders || [])
      .sort((a, b) => new Date(b.created) - new Date(a.created))
      .slice(0, 50);

    res.json({ status: 'ok', orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
