// Client-side calls to the Vercel serverless API routes
// These proxy securely to CoinSpot — API keys never touch the browser

export async function fetchRealBalance() {
  try {
    const res = await fetch('/api/coinspot/balance');
    if (!res.ok) return null;
    const data = await res.json();
    return data.status === 'ok' ? data : null;
  } catch { return null; }
}

export async function placeRealBuy(coinSymbol, audAmount) {
  try {
    const res = await fetch('/api/coinspot/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cointype: coinSymbol.toUpperCase(), amount: audAmount }),
    });
    return await res.json();
  } catch (err) {
    return { error: err.message };
  }
}

export async function placeRealSell(coinSymbol, audAmount) {
  try {
    const res = await fetch('/api/coinspot/sell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cointype: coinSymbol.toUpperCase(), amount: audAmount }),
    });
    return await res.json();
  } catch (err) {
    return { error: err.message };
  }
}

export async function fetchRealOrders() {
  try {
    const res = await fetch('/api/coinspot/orders');
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// Check if exchange is configured (keys set in Vercel env vars)
export async function checkExchangeStatus() {
  try {
    const res = await fetch('/api/coinspot/balance');
    const data = await res.json();
    if (data.error?.includes('not configured')) return { connected: false, reason: 'API keys not set in Vercel' };
    if (data.status === 'ok') return { connected: true, audBalance: data.audBalance };
    return { connected: false, reason: data.error || 'Unknown error' };
  } catch {
    return { connected: false, reason: 'Could not reach exchange API' };
  }
}
