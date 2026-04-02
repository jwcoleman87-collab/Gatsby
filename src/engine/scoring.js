import { SURVIVAL_WEIGHTS, YIELD_SOURCES, ARBITRAGE_TYPES, TREND_SIGNALS, DIGITAL_OPPS } from './constants';
import { getCoinThreats } from './intelligence';

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcRSI(prices, period = 14) {
  if (!prices || prices.length < period + 1) return 50;
  const changes = prices.slice(1).map((p, i) => p - prices[i]);
  const recent = changes.slice(-period);
  const gains = recent.filter(c => c > 0).reduce((s, c) => s + c, 0) / period;
  const losses = recent.filter(c => c < 0).reduce((s, c) => s + Math.abs(c), 0) / period;
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function calcEMA(prices, period) {
  if (!prices || prices.length < period) return prices?.[prices.length - 1] || 0;
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((s, p) => s + p, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

function calcMA(prices, period) {
  if (!prices || prices.length < period) return prices?.[prices.length - 1] || 0;
  return prices.slice(-period).reduce((s, p) => s + p, 0) / period;
}

function calcBollingerPosition(prices, period = 20) {
  if (!prices || prices.length < period) return 0.5;
  const slice = prices.slice(-period);
  const mean = slice.reduce((s, p) => s + p, 0) / period;
  const variance = slice.reduce((s, p) => s + (p - mean) ** 2, 0) / period;
  const std = Math.sqrt(variance);
  const current = prices[prices.length - 1];
  if (std === 0) return 0.5;
  return (current - (mean - 2 * std)) / (4 * std); // 0=lower band, 1=upper band
}

function calcVolatility(prices) {
  if (!prices || prices.length < 2) return 0;
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  if (low === 0) return 0;
  return (high - low) / low;
}

function calcMomentum(prices) {
  if (!prices || prices.length < 4) return 0;
  const recent = prices.slice(-3).reduce((s, p) => s + p, 0) / 3;
  const overall = prices.reduce((s, p) => s + p, 0) / prices.length;
  if (overall === 0) return 0;
  return (recent - overall) / overall;
}

function scoreToSurvivalDimensions(opts) {
  return {
    downsideRisk:       opts.downsideRisk       ?? 5,
    failureProbability: opts.failureProbability  ?? 5,
    speedToCash:        opts.speedToCash         ?? 5,
    recoveryIfWrong:    opts.recoveryIfWrong     ?? 5,
    capitalRequired:    opts.capitalRequired     ?? 5,
    repeatability:      opts.repeatability       ?? 5,
    intelligence:       opts.intelligence        ?? 5,
    scalability:        opts.scalability         ?? 5,
    defensibility:      opts.defensibility       ?? 5,
    dependencyRisk:     opts.dependencyRisk      ?? 5,
    knowledgeGained:    opts.knowledgeGained     ?? 5,
  };
}

function calcTotalScore(dims) {
  return Object.entries(SURVIVAL_WEIGHTS).reduce((sum, [key, weight]) => {
    return sum + (dims[key] ?? 5) * weight;
  }, 0);
}

function deriveSignal(netScore) {
  if (netScore >= 8) return 'STRONG BUY';
  if (netScore >= 5) return 'BUY';
  if (netScore >= 3) return 'LEAN BUY';
  if (netScore <= -6) return 'STRONG SELL';
  if (netScore <= -3) return 'SELL';
  if (netScore >= 1) return 'WATCH';
  return 'HOLD';
}

function positionSize(brain, capital, risk, threatLevel) {
  let pct = brain.maxPositionPct;
  if (risk === 'MODERATE') pct *= 0.60;
  else if (risk === 'HIGH') pct *= 0.32;
  else if (risk === 'EXTREME') pct = brain.minPositionPct;
  if (threatLevel === 'ELEVATED') pct *= 0.6;
  if (threatLevel === 'SEVERE') pct *= 0.3;
  if (threatLevel === 'CRITICAL') return 0;
  return Math.round(capital * pct * 100) / 100;
}

// ── Market scoring ────────────────────────────────────────────────────────────

export function scoreMarketOpp(coin, intel, brain, capital) {
  const prices = coin.sparkline_in_7d?.price || [];
  if (prices.length === 0) return null;

  const rsi = calcRSI(prices);
  const ma3 = calcMA(prices, 3);
  const ma7 = calcMA(prices, 7);
  const bbPos = calcBollingerPosition(prices);
  const volatility = calcVolatility(prices);
  const momentum = calcMomentum(prices);
  const macd12 = calcEMA(prices, 12);
  const macd26 = calcEMA(prices, 26);
  const macdVal = macd12 - macd26;
  const current = prices[prices.length - 1] || coin.current_price || 0;
  const high7d = Math.max(...prices);
  const low7d = Math.min(...prices);
  const distFromHigh = high7d > 0 ? (high7d - current) / high7d : 0;
  const distFromLow = low7d > 0 ? (current - low7d) / low7d : 0;

  // News threat for this coin
  const coinThreat = getCoinThreats(coin.id, coin.symbol, intel?.news || []);
  const threatLevel = coinThreat.threatLevel;

  // Weighted factor system
  let buyScore = 0;
  let sellScore = 0;
  const reasoning = [];

  // RSI
  if (rsi < brain.rsiOversold) {
    const w = ((brain.rsiOversold - rsi) / brain.rsiOversold) * 3;
    buyScore += w;
    reasoning.push(`RSI ${rsi.toFixed(0)} — oversold (buy signal)`);
  } else if (rsi > brain.rsiOverbought) {
    const w = ((rsi - brain.rsiOverbought) / (100 - brain.rsiOverbought)) * 3;
    sellScore += w;
    reasoning.push(`RSI ${rsi.toFixed(0)} — overbought (sell signal)`);
  }

  // MA crossover
  if (ma3 > ma7 * 1.005) {
    buyScore += 2;
    reasoning.push(`MA crossover bullish (3d ${ma3.toFixed(4)} > 7d ${ma7.toFixed(4)})`);
  } else if (ma3 < ma7 * 0.995) {
    sellScore += 2;
    reasoning.push(`MA crossover bearish (3d ${ma3.toFixed(4)} < 7d ${ma7.toFixed(4)})`);
  }

  // Bollinger Band position
  if (bbPos < 0.2) {
    buyScore += 1.5;
    reasoning.push(`Price at lower Bollinger Band (${(bbPos*100).toFixed(0)}%) — oversold`);
  } else if (bbPos > 0.8) {
    sellScore += 1.5;
    reasoning.push(`Price at upper Bollinger Band (${(bbPos*100).toFixed(0)}%) — overbought`);
  }

  // MACD
  if (macdVal > 0) {
    buyScore += 1;
    reasoning.push(`MACD positive (+${macdVal.toFixed(4)})`);
  } else {
    sellScore += 1;
    reasoning.push(`MACD negative (${macdVal.toFixed(4)})`);
  }

  // Volatility penalty
  const volPenalty = volatility * brain.volatilityPenalty;
  if (volatility > 0.2) {
    sellScore += volPenalty * 2;
    reasoning.push(`High volatility ${(volatility*100).toFixed(1)}% — risk penalty`);
  }

  // Momentum
  if (momentum > 0.05) {
    buyScore += momentum * 4;
    reasoning.push(`Positive momentum +${(momentum*100).toFixed(1)}%`);
  } else if (momentum < -0.05) {
    sellScore += Math.abs(momentum) * 4;
    reasoning.push(`Negative momentum ${(momentum*100).toFixed(1)}%`);
  }

  // Distance from low (buy the dip)
  if (distFromHigh > 0.2 && distFromLow < 0.1) {
    buyScore += 1.5;
    reasoning.push(`Near 7d low — potential reversal point`);
  }

  // Intel overlay
  const fngVal = intel?.fng?.value || 50;
  const isTrending = (intel?.trendingCoins || []).some(c => c.id === coin.id);

  if (fngVal <= 25) {
    buyScore += 1 * brain.sentimentWeight;
    reasoning.push(`Extreme fear (F&G ${fngVal}) — contrarian buy`);
  } else if (fngVal >= 80) {
    sellScore += 1 * brain.sentimentWeight;
    reasoning.push(`Extreme greed (F&G ${fngVal}) — contrarian sell`);
  }

  if (isTrending) {
    buyScore += 1.5 * brain.sentimentWeight;
    reasoning.push(`Trending on CoinGecko`);
  }

  if (coinThreat.netScore > 0) {
    buyScore += coinThreat.netScore * 0.5 * brain.sentimentWeight;
    reasoning.push(`Positive news sentiment (+${coinThreat.netScore.toFixed(1)})`);
  } else if (coinThreat.netScore < 0) {
    sellScore += Math.abs(coinThreat.netScore) * 0.5 * brain.sentimentWeight;
    reasoning.push(`Negative news sentiment (${coinThreat.netScore.toFixed(1)})`);
  }

  let netScore = buyScore - sellScore;
  let signal = deriveSignal(netScore);
  let signalStrength = Math.min(100, Math.max(0, Math.round(50 + netScore * 5)));

  // Threat overrides
  if (threatLevel === 'CRITICAL') { signal = 'BLOCKED'; signalStrength = 0; }
  else if (threatLevel === 'SEVERE' && (signal === 'STRONG BUY' || signal === 'BUY' || signal === 'LEAN BUY')) {
    signal = 'WATCH'; reasoning.push(`SEVERE threat overrides buy signal`);
  }

  // Survival dimensions
  const riskLevel = volatility > 0.3 ? 'HIGH' : volatility > 0.15 ? 'MODERATE' : 'LOW';
  const dims = scoreToSurvivalDimensions({
    downsideRisk:       Math.max(1, 10 - volatility * 20),
    failureProbability: Math.max(1, 10 - (signal === 'STRONG BUY' ? 3 : signal === 'BUY' ? 1 : 0)),
    speedToCash:        8,
    recoveryIfWrong:    9,
    capitalRequired:    7,
    repeatability:      9,
    intelligence:       5 + (coinThreat.netScore * 0.5),
    scalability:        8,
    defensibility:      5,
    dependencyRisk:     5,
    knowledgeGained:    7,
  });
  const totalScore = Math.min(10, Math.max(0, calcTotalScore(dims)));
  const suggested = positionSize(brain, capital, riskLevel, threatLevel);

  return {
    id: `markets-${coin.id}`,
    domain: 'MARKETS',
    name: coin.name,
    subtitle: `${coin.symbol?.toUpperCase()} • Rank #${coin.market_cap_rank}`,
    signal,
    signalStrength,
    totalScore: +totalScore.toFixed(2),
    riskLevel,
    threatLevel,
    suggestedPosition: suggested,
    metrics: {
      price: coin.current_price,
      change24h: coin.price_change_percentage_24h,
      change7d: coin.price_change_percentage_7d_in_currency,
      volume: coin.total_volume,
      marketCap: coin.market_cap,
      rsi: +rsi.toFixed(1),
      volatility: +volatility.toFixed(3),
      momentum: +momentum.toFixed(3),
      macd: +macdVal.toFixed(6),
      bbPos: +bbPos.toFixed(2),
    },
    sparkline: prices,
    dims,
    reasoning,
    alerts: coinThreat.alerts,
    isTrending,
    coinId: coin.id,
    coinSymbol: coin.symbol,
    image: coin.image,
  };
}

// ── Yield scoring ─────────────────────────────────────────────────────────────

export function scoreYieldOpp(source, brain, capital, liveYieldData) {
  const dims = scoreToSurvivalDimensions({
    downsideRisk: source.risk === 'MINIMAL' ? 9 : source.risk === 'LOW' ? 7.5 : source.risk === 'MODERATE' ? 5 : source.risk === 'HIGH' ? 3 : 1,
    failureProbability: source.risk === 'MINIMAL' ? 9 : source.risk === 'LOW' ? 7 : source.risk === 'MODERATE' ? 5 : 3,
    speedToCash: source.category === 'savings' ? 7 : source.category === 'staking' ? 5 : source.category === 'lp' ? 4 : 6,
    recoveryIfWrong: source.risk === 'MINIMAL' ? 9 : source.risk === 'LOW' ? 8 : source.risk === 'MODERATE' ? 5 : 3,
    capitalRequired: source.category === 'staking' ? 5 : source.category === 'savings' ? 8 : 6,
    repeatability: 9,
    intelligence: 6,
    scalability: 7,
    defensibility: source.category === 'savings' ? 9 : 5,
    dependencyRisk: source.risk === 'HIGH' ? 3 : 6,
    knowledgeGained: 7,
  });
  const totalScore = +calcTotalScore(dims).toFixed(2);

  // Signal based on APY + risk
  let signal = 'WATCH';
  const adjApy = source.apy * (source.risk === 'MINIMAL' ? 1.3 : source.risk === 'LOW' ? 1.1 : source.risk === 'MODERATE' ? 0.8 : 0.5);
  if (adjApy > 8) signal = 'STRONG BUY';
  else if (adjApy > 5) signal = 'BUY';
  else if (adjApy > 3) signal = 'LEAN BUY';
  else signal = 'WATCH';

  const suggested = positionSize(brain, capital, source.risk === 'HIGH' ? 'HIGH' : source.risk === 'MODERATE' ? 'MODERATE' : 'LOW', 'CLEAR');
  const daily = (source.apy / 365 / 100 * suggested);
  const monthly = daily * 30;

  return {
    id: `yield-${source.id}`,
    domain: 'YIELD',
    name: source.name,
    subtitle: source.subtitle,
    signal,
    signalStrength: Math.round(adjApy * 6),
    totalScore,
    riskLevel: source.risk,
    threatLevel: 'CLEAR',
    suggestedPosition: suggested,
    metrics: {
      apy: source.apy,
      protocol: source.protocol,
      chain: source.chain,
      category: source.category,
      dailyEst: +daily.toFixed(2),
      monthlyEst: +monthly.toFixed(2),
    },
    dims,
    reasoning: [`${source.apy}% APY — ${source.risk} risk`, `Est. A$${daily.toFixed(2)}/day on A$${suggested}`],
    alerts: [],
  };
}

// ── Yield from DefiLlama ──────────────────────────────────────────────────────

export function scoreDefiPool(pool, brain, capital) {
  if (!pool || pool.tvlUsd < 10_000_000 || pool.apy < 1 || pool.apy > 100) return null;
  const isStable = pool.stablecoin || (pool.symbol || '').toUpperCase().includes('USD') || (pool.symbol || '').toUpperCase().includes('DAI');
  const risk = pool.tvlUsd > 100_000_000 ? (isStable ? 'LOW' : 'MODERATE') : (isStable ? 'MODERATE' : 'HIGH');

  const dims = scoreToSurvivalDimensions({
    downsideRisk: risk === 'LOW' ? 7 : risk === 'MODERATE' ? 5 : 3,
    failureProbability: risk === 'LOW' ? 7 : risk === 'MODERATE' ? 5 : 4,
    speedToCash: 5,
    recoveryIfWrong: risk === 'LOW' ? 7 : 5,
    capitalRequired: 5,
    repeatability: 8,
    intelligence: 5,
    scalability: 6,
    defensibility: 4,
    dependencyRisk: risk === 'HIGH' ? 3 : 5,
    knowledgeGained: 7,
  });
  const totalScore = +calcTotalScore(dims).toFixed(2);

  const adjApy = pool.apy * (risk === 'LOW' ? 1.1 : risk === 'MODERATE' ? 0.85 : 0.6);
  let signal = 'WATCH';
  if (adjApy > 10) signal = 'STRONG BUY';
  else if (adjApy > 6) signal = 'BUY';
  else if (adjApy > 3) signal = 'LEAN BUY';

  const suggested = positionSize(brain, capital, risk, 'CLEAR');
  const daily = (pool.apy / 365 / 100 * suggested);

  return {
    id: `yield-defi-${pool.pool}`,
    domain: 'YIELD',
    name: `${pool.symbol || pool.project} Pool`,
    subtitle: `${pool.project} • ${pool.chain}`,
    signal,
    signalStrength: Math.min(100, Math.round(adjApy * 5)),
    totalScore,
    riskLevel: risk,
    threatLevel: 'CLEAR',
    suggestedPosition: suggested,
    metrics: {
      apy: +pool.apy.toFixed(2),
      tvl: pool.tvlUsd,
      protocol: pool.project,
      chain: pool.chain,
      stablecoin: isStable,
      dailyEst: +daily.toFixed(2),
      monthlyEst: +(daily * 30).toFixed(2),
    },
    dims,
    reasoning: [`${pool.apy.toFixed(1)}% APY, TVL $${(pool.tvlUsd/1e6).toFixed(0)}M`, `${pool.project} on ${pool.chain}`, `${isStable ? 'Stablecoin' : 'Volatile'} ${risk} risk`],
    alerts: [],
  };
}

// ── Arbitrage scoring ─────────────────────────────────────────────────────────

export function scoreArbitrageOpp(type, brain, capital, exchangeData) {
  const speedScore = { FAST: 9, MEDIUM: 6, SLOW: 4 }[type.speed] || 5;
  const diffScore = { LOW: 8, MODERATE: 5, HIGH: 3 }[type.difficulty] || 5;
  const capScore = { LOW: 9, MEDIUM: 6, HIGH: 3 }[type.capitalReq] || 5;

  const dims = scoreToSurvivalDimensions({
    downsideRisk: diffScore,
    failureProbability: diffScore,
    speedToCash: speedScore,
    recoveryIfWrong: speedScore,
    capitalRequired: capScore,
    repeatability: 8,
    intelligence: 5,
    scalability: type.capitalReq === 'HIGH' ? 7 : 5,
    defensibility: 4,
    dependencyRisk: type.difficulty === 'HIGH' ? 4 : 6,
    knowledgeGained: 8,
  });
  const totalScore = +calcTotalScore(dims).toFixed(2);

  let signal = 'WATCH';
  if (totalScore >= 7.5) signal = 'BUY';
  else if (totalScore >= 6.5) signal = 'LEAN BUY';

  return {
    id: `arb-${type.id}`,
    domain: 'ARBITRAGE',
    name: type.name,
    subtitle: type.subtitle,
    signal,
    signalStrength: Math.round(totalScore * 10),
    totalScore,
    riskLevel: type.difficulty === 'LOW' ? 'LOW' : type.difficulty === 'MODERATE' ? 'MODERATE' : 'HIGH',
    threatLevel: 'CLEAR',
    suggestedPosition: positionSize(brain, capital, type.difficulty === 'HIGH' ? 'HIGH' : 'MODERATE', 'CLEAR'),
    metrics: { difficulty: type.difficulty, speed: type.speed, capitalReq: type.capitalReq },
    dims,
    reasoning: [type.description, `Speed: ${type.speed} • Difficulty: ${type.difficulty}`],
    alerts: [],
  };
}

// ── Trend scoring ─────────────────────────────────────────────────────────────

export function scoreTrendOpp(signal, brain, intel) {
  const trendingIds = new Set((intel?.trendingCoins || []).map(c => c.id));
  const isActive = signal.id === 'google-trends' ? trendingIds.size > 5 : false;
  const fngBullish = (intel?.fng?.value || 50) > 60;

  const dims = scoreToSurvivalDimensions({
    downsideRisk: 8,
    failureProbability: 6,
    speedToCash: 4,
    recoveryIfWrong: 9,
    capitalRequired: 10,
    repeatability: 7,
    intelligence: fngBullish ? 7 : 5,
    scalability: 6,
    defensibility: 5,
    dependencyRisk: 7,
    knowledgeGained: 9,
  });
  const totalScore = +calcTotalScore(dims).toFixed(2);

  return {
    id: `trend-${signal.id}`,
    domain: 'TRENDS',
    name: signal.name,
    subtitle: signal.subtitle,
    signal: 'WATCH',
    signalStrength: isActive ? 70 : 40,
    totalScore,
    riskLevel: 'LOW',
    threatLevel: 'CLEAR',
    suggestedPosition: 0,
    metrics: { status: isActive ? 'ACTIVE' : 'MONITORING', icon: signal.icon },
    dims,
    reasoning: ['Research signal — no capital deployed', `Monitor ${signal.subtitle}`],
    alerts: [],
  };
}

// ── Digital scoring ───────────────────────────────────────────────────────────

export function scoreDigitalOpp(opp, brain, capital) {
  const dims = scoreToSurvivalDimensions({
    downsideRisk: 8, failureProbability: 5, speedToCash: 4,
    recoveryIfWrong: 8, capitalRequired: 9, repeatability: 7,
    intelligence: 5, scalability: 8, defensibility: 6, dependencyRisk: 7, knowledgeGained: 9,
  });
  const totalScore = +calcTotalScore(dims).toFixed(2);
  return {
    id: `digital-${opp.id}`,
    domain: 'DIGITAL',
    name: opp.name,
    subtitle: opp.subtitle,
    signal: 'WATCH',
    signalStrength: 45,
    totalScore,
    riskLevel: 'LOW',
    threatLevel: 'CLEAR',
    suggestedPosition: 0,
    metrics: { icon: opp.icon },
    dims,
    reasoning: ['Manual research required', 'No auto-deployment'],
    alerts: [],
  };
}

// ── Macro insights ────────────────────────────────────────────────────────────

export function buildMacroInsights(intel, brain, capital) {
  const insights = [];
  const signals = intel?.macroSignals || [];

  signals.forEach((sig, i) => {
    const isBuy = sig.type === 'ACCUMULATE' || sig.type === 'AGGRESSIVE' || sig.type === 'ALT_SEASON';
    const isSell = sig.type === 'DEFENSIVE';
    const dims = scoreToSurvivalDimensions({
      downsideRisk: isBuy ? 6 : 8,
      failureProbability: 5,
      speedToCash: 5,
      recoveryIfWrong: 7,
      capitalRequired: 8,
      repeatability: 6,
      intelligence: 8,
      scalability: 7,
      defensibility: 5,
      dependencyRisk: 6,
      knowledgeGained: 8,
    });
    insights.push({
      id: `macro-${sig.type}-${i}`,
      domain: 'MACRO',
      name: sig.type.replace(/_/g, ' '),
      subtitle: sig.msg,
      signal: isBuy ? 'WATCH' : isSell ? 'HOLD' : 'WATCH',
      signalStrength: 55,
      totalScore: +calcTotalScore(dims).toFixed(2),
      riskLevel: 'LOW',
      threatLevel: 'CLEAR',
      suggestedPosition: 0,
      metrics: { type: sig.type },
      dims,
      reasoning: [sig.msg, 'Macro signal — adjust portfolio allocation'],
      alerts: [],
    });
  });

  // Always add at least one macro card
  if (insights.length === 0) {
    const dims = scoreToSurvivalDimensions({ intelligence: 5 });
    insights.push({
      id: 'macro-neutral',
      domain: 'MACRO',
      name: 'NEUTRAL ENVIRONMENT',
      subtitle: 'No extreme macro signals detected',
      signal: 'HOLD',
      signalStrength: 50,
      totalScore: +calcTotalScore(dims).toFixed(2),
      riskLevel: 'LOW',
      threatLevel: 'CLEAR',
      suggestedPosition: 0,
      metrics: {},
      dims,
      reasoning: ['Market conditions within normal range'],
      alerts: [],
    });
  }

  return insights;
}
