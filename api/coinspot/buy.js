const { coinspotPost } = require('./_auth');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.COINSPOT_API_KEY;
  const secret = process.env.COINSPOT_API_SECRET;
  if (!key || !secret) return res.status(500).json({ error: 'API keys not configured' });

  const { cointype, amount } = req.body;
  if (!cointype || !amount) return res.status(400).json({ error: 'Missing cointype or amount' });
  if (amount < 5) return res.status(400).json({ error: 'Minimum order is A$5' });
  if (amount > 137) return res.status(400).json({ error: 'Exceeds Gatsby max order limit' });

  try {
    const data = await coinspotPost('/api/v2/my/orders/market/buy', key, secret, {
      cointype: cointype.toUpperCase(),
      amount: parseFloat(amount),
      amounttype: 'aud',
    });

    if (data.status !== 'ok') return res.status(400).json({ error: data.message || 'Order failed', raw: data });

    res.json({
      status: 'ok',
      orderId: data.coin?.id || null,
      cointype: cointype.toUpperCase(),
      audSpent: parseFloat(amount),
      rate: data.coin?.rate,
      message: `Market buy placed: A$${amount} of ${cointype.toUpperCase()}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
