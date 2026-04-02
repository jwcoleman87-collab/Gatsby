export const THREAT_WORDS = {
  CRITICAL: ['hack', 'hacked', 'exploit', 'rug pull', 'scam', 'fraud', 'stolen', 'security breach',
             'drained', 'compromised', 'ponzi', 'arrest', 'charged', 'indicted', 'banned',
             'delisted', 'insolvent', 'bankrupt', 'collapse'],
  SEVERE:   ['investigation', 'subpoena', 'regulatory action', 'cease and desist', 'penalty',
             'class action', 'crash', 'plunge', 'sell-off', 'liquidation', 'default',
             'suspension', 'frozen'],
  WARNING:  ['concern', 'risk', 'warning', 'decline', 'downgrade', 'bearish', 'overvalued',
             'bubble', 'fear', 'uncertainty', 'layoff', 'delay', 'failed'],
};

export const CATALYST_WORDS = {
  STRONG:   ['partnership', 'etf approved', 'listing', 'upgrade', 'mainnet', 'launch',
             'institutional', 'adoption', 'billion', 'acquisition', 'record revenue',
             'breakout', 'rally'],
  MODERATE: ['bullish', 'growth', 'expansion', 'milestone', 'integration', 'network upgrade',
             'staking', 'yield', 'accumulation', 'inflow'],
};

export function analyzeNews(title, body = '') {
  const text = (title + ' ' + body).toLowerCase();
  let threatLevel = 'CLEAR';
  let threatScore = 0;
  let catalystScore = 0;
  const alerts = [];

  for (const word of THREAT_WORDS.CRITICAL) {
    if (text.includes(word)) {
      threatLevel = 'CRITICAL';
      threatScore -= 5;
      alerts.push({ level: 'CRITICAL', text: `⛔ ${word.toUpperCase()} detected` });
    }
  }
  for (const word of THREAT_WORDS.SEVERE) {
    if (text.includes(word) && threatLevel !== 'CRITICAL') {
      threatLevel = 'SEVERE';
      threatScore -= 3;
      alerts.push({ level: 'SEVERE', text: `🔴 ${word.toUpperCase()} signal` });
    }
  }
  for (const word of THREAT_WORDS.WARNING) {
    if (text.includes(word)) {
      if (threatLevel === 'CLEAR') threatLevel = 'WARNING';
      threatScore -= 1.5;
      alerts.push({ level: 'WARNING', text: `⚠️ ${word}` });
    }
  }
  for (const word of CATALYST_WORDS.STRONG) {
    if (text.includes(word)) {
      catalystScore += 2.5;
      alerts.push({ level: 'CATALYST_STRONG', text: `✅ ${word.toUpperCase()}` });
    }
  }
  for (const word of CATALYST_WORDS.MODERATE) {
    if (text.includes(word)) {
      catalystScore += 1.5;
      alerts.push({ level: 'CATALYST_MODERATE', text: `📈 ${word}` });
    }
  }

  // Negative signals weighted heavier
  const netScore = threatScore + catalystScore;
  return { threatLevel, threatScore, catalystScore, netScore, alerts: alerts.slice(0, 5) };
}

export async function fetchAllIntel() {
  const results = await Promise.allSettled([
    fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=aud&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=7d').then(r => r.json()),
    fetch('https://api.coingecko.com/api/v3/global').then(r => r.json()),
    fetch('https://api.coingecko.com/api/v3/search/trending').then(r => r.json()),
    fetch('https://api.coingecko.com/api/v3/exchanges?per_page=10').then(r => r.json()),
    fetch('https://api.alternative.me/fng/?limit=7').then(r => r.json()),
    fetch('https://yields.llama.fi/pools').then(r => r.json()),
    fetch('https://cryptopanic.com/api/free/v1/posts/?auth_token=free&public=true&kind=news&filter=important').then(r => r.json()),
  ]);

  return {
    markets:   results[0].status === 'fulfilled' ? results[0].value : null,
    global:    results[1].status === 'fulfilled' ? results[1].value : null,
    trending:  results[2].status === 'fulfilled' ? results[2].value : null,
    exchanges: results[3].status === 'fulfilled' ? results[3].value : null,
    fng:       results[4].status === 'fulfilled' ? results[4].value : null,
    yields:    results[5].status === 'fulfilled' ? results[5].value : null,
    news:      results[6].status === 'fulfilled' ? results[6].value : null,
  };
}

export function buildIntelReport(raw) {
  const report = {
    fng: null,
    fngTrend: [],
    btcDominance: null,
    totalMarketCapChange: null,
    trendingCoins: [],
    defiPoolCount: 0,
    macroSignals: [],
    news: [],
    exchangeVolume: null,
  };

  // Fear & Greed
  if (raw.fng?.data) {
    const data = raw.fng.data;
    report.fng = { value: parseInt(data[0]?.value || 50), label: data[0]?.value_classification || 'Neutral' };
    report.fngTrend = data.slice(0, 7).map(d => parseInt(d.value));
  }

  // Global market
  if (raw.global?.data) {
    const g = raw.global.data;
    report.btcDominance = g.market_cap_percentage?.btc?.toFixed(1);
    report.totalMarketCapChange = g.market_cap_change_percentage_24h_usd?.toFixed(2);
  }

  // Trending
  if (raw.trending?.coins) {
    report.trendingCoins = raw.trending.coins.slice(0, 7).map(c => ({
      id: c.item.id,
      name: c.item.name,
      symbol: c.item.symbol,
      rank: c.item.market_cap_rank,
    }));
  }

  // DeFi pools
  if (raw.yields?.data) {
    const pools = raw.yields.data.filter(p => p.tvlUsd > 10_000_000 && p.apy > 1 && p.apy < 100);
    report.defiPoolCount = pools.length;
  }

  // News
  if (raw.news?.results) {
    report.news = raw.news.results.slice(0, 20).map(item => {
      const analysis = analyzeNews(item.title || '', item.domain || '');
      return {
        id: item.id,
        title: item.title,
        url: item.url,
        source: item.source?.title || 'Unknown',
        publishedAt: item.published_at,
        sentiment: analysis.netScore,
        threatLevel: analysis.threatLevel,
        alerts: analysis.alerts,
      };
    });
  }

  // Exchange volume
  if (raw.exchanges?.length) {
    const totalVol = raw.exchanges.reduce((s, e) => s + (e.trade_volume_24h_btc || 0), 0);
    report.exchangeVolume = totalVol.toFixed(0);
  }

  // Macro signals
  const signals = [];
  if (report.totalMarketCapChange) {
    const chg = parseFloat(report.totalMarketCapChange);
    if (chg < -5) signals.push({ type: 'DEFENSIVE', msg: `Market contracted ${chg.toFixed(1)}% — go defensive` });
    else if (chg > 5) signals.push({ type: 'AGGRESSIVE', msg: `Market expanded ${chg.toFixed(1)}% — opportunity window` });
  }
  if (report.btcDominance) {
    const dom = parseFloat(report.btcDominance);
    if (dom > 60) signals.push({ type: 'BTC_FOCUS', msg: `BTC dominance ${dom}% — BTC outperforming` });
    else if (dom < 40) signals.push({ type: 'ALT_SEASON', msg: `BTC dominance ${dom}% — alt season signal` });
  }
  if (report.fng) {
    if (report.fng.value <= 20) signals.push({ type: 'ACCUMULATE', msg: `Extreme Fear (${report.fng.value}) — contrarian accumulation signal` });
    else if (report.fng.value >= 85) signals.push({ type: 'DEFENSIVE', msg: `Extreme Greed (${report.fng.value}) — risk-off signal` });
  }
  report.macroSignals = signals;

  return report;
}

// Get news threats for a specific coin
export function getCoinThreats(coinId, coinSymbol, newsItems) {
  const term = (coinId + ' ' + coinSymbol).toLowerCase();
  const relevant = (newsItems || []).filter(n => {
    const t = (n.title || '').toLowerCase();
    return t.includes(coinId?.toLowerCase()) || t.includes(coinSymbol?.toLowerCase());
  });
  if (relevant.length === 0) return { threatLevel: 'CLEAR', alerts: [], netScore: 0 };
  let worstThreat = 'CLEAR';
  let totalScore = 0;
  const allAlerts = [];
  relevant.forEach(n => {
    const a = analyzeNews(n.title || '');
    if (a.threatLevel === 'CRITICAL') worstThreat = 'CRITICAL';
    else if (a.threatLevel === 'SEVERE' && worstThreat !== 'CRITICAL') worstThreat = 'SEVERE';
    else if (a.threatLevel === 'WARNING' && worstThreat === 'CLEAR') worstThreat = 'WARNING';
    totalScore += a.netScore;
    allAlerts.push(...a.alerts);
  });
  return { threatLevel: worstThreat, alerts: allAlerts.slice(0, 4), netScore: totalScore };
}
