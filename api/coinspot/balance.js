const { coinspotPost } = require('./_auth');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.COINSPOT_API_KEY;
  const secret = process.env.COINSPOT_API_SECRET;
  if (!key || !secret) return res.status(500).json({ error: 'API keys not configured in Vercel environment variables' });

  try {
    const data = await coinspotPost('/api/v2/ro/my/balances', key, secret);
    if (data.status !== 'ok') return res.status(400).json({ error: data.message || 'CoinSpot error', raw: data });

    // Extract AUD balance + coin holdings
    const audBalance = data.balances?.find(b => b.AUD)?.AUD?.balance || 0;
    const coins = Object.entries(data.balances || {})
      .filter(([sym]) => sym !== 'AUD')
      .map(([symbol, info]) => ({
        symbol,
        balance: info.balance,
        audValue: info.audbalance,
        rate: info.rate,
      }))
      .filter(c => c.audValue > 0.50);

    res.json({ status: 'ok', audBalance: parseFloat(audBalance), coins });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
