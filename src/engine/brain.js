import { TIERS } from './constants';

export const DEFAULT_BRAIN = {
  generation: 0,
  tier: 1,
  autoWins: 0,
  totalWins: 0,
  totalLosses: 0,
  consecutiveLosses: 0,
  circuitBreakerLimit: 3,
  circuitBreakerTripped: false,
  autoMinScore: 7.5,
  autoMaxAmount: 22,
  maxPositionPct: 0.25,
  minPositionPct: 0.04,
  rsiOversold: 35,
  rsiOverbought: 65,
  volatilityPenalty: 1.0,
  sentimentWeight: 1.0,
  threatMultiplier: 1.2,
  domainWeights: {
    MARKETS: 1.0,
    YIELD: 1.0,
    ARBITRAGE: 1.0,
    TRENDS: 1.0,
    DIGITAL: 1.0,
    MACRO: 1.0,
  },
  signalPerformance: {},
  lessons: [],
};

export function evolveTier(brain) {
  const nextTierDef = TIERS.find(t => t.tier === brain.tier + 1);
  if (!nextTierDef) return brain;
  const totalResolved = brain.totalWins + brain.totalLosses;
  const winRate = totalResolved > 0 ? brain.totalWins / totalResolved : 0;
  if (brain.autoWins >= nextTierDef.winsNeeded && winRate >= nextTierDef.minWinRate) {
    return {
      ...brain,
      tier: nextTierDef.tier,
      autoMaxAmount: nextTierDef.autoLimit,
      lessons: [
        {
          gen: brain.generation + 1,
          ts: Date.now(),
          type: 'TIER_UP',
          msg: `Evolved to Tier ${nextTierDef.tier} (${nextTierDef.name}) — auto limit now A$${nextTierDef.autoLimit}`,
        },
        ...brain.lessons,
      ],
    };
  }
  return brain;
}

export function evolveBrain(brain, recentTrades) {
  if (recentTrades.length === 0) return brain;

  const resolved = recentTrades.filter(t => t.outcome);
  if (resolved.length < 3) return brain;

  const last3 = resolved.slice(-3);
  const wins = last3.filter(t => t.outcome === 'WON').length;
  const losses = last3.filter(t => t.outcome === 'LOST').length;
  const winRate3 = wins / 3;

  let updated = { ...brain, generation: brain.generation + 1 };
  const lessons = [];

  // RSI adjustment
  if (winRate3 < 0.34) {
    const newOversold = Math.max(25, updated.rsiOversold - 3);
    const newOverbought = Math.min(75, updated.rsiOverbought + 3);
    if (newOversold !== updated.rsiOversold) {
      lessons.push({ gen: updated.generation, ts: Date.now(), type: 'RSI', msg: `RSI tightened: oversold ${updated.rsiOversold}→${newOversold}, overbought ${updated.rsiOverbought}→${newOverbought}` });
      updated.rsiOversold = newOversold;
      updated.rsiOverbought = newOverbought;
    }
  } else if (winRate3 > 0.66) {
    const newOversold = Math.min(45, updated.rsiOversold + 2);
    const newOverbought = Math.max(55, updated.rsiOverbought - 2);
    if (newOversold !== updated.rsiOversold) {
      lessons.push({ gen: updated.generation, ts: Date.now(), type: 'RSI', msg: `RSI widened: oversold ${updated.rsiOversold}→${newOversold}, overbought ${updated.rsiOverbought}→${newOverbought}` });
      updated.rsiOversold = newOversold;
      updated.rsiOverbought = newOverbought;
    }
  }

  // Position sizing
  const consLosses = brain.consecutiveLosses;
  if (consLosses >= 2) {
    const newPct = Math.max(0.08, updated.maxPositionPct - 0.03);
    if (newPct !== updated.maxPositionPct) {
      lessons.push({ gen: updated.generation, ts: Date.now(), type: 'POSITION', msg: `Max position reduced: ${(updated.maxPositionPct*100).toFixed(0)}%→${(newPct*100).toFixed(0)}% after ${consLosses} consecutive losses` });
      updated.maxPositionPct = newPct;
    }
  }

  // Volatility penalty (check if high-vol trades underperformed)
  const highVolLosses = last3.filter(t => t.metrics?.volatility > 0.15 && t.outcome === 'LOST').length;
  if (highVolLosses >= 2) {
    const newPenalty = Math.min(2.0, updated.volatilityPenalty + 0.2);
    lessons.push({ gen: updated.generation, ts: Date.now(), type: 'VOLATILITY', msg: `Volatility penalty increased: ${updated.volatilityPenalty.toFixed(1)}→${newPenalty.toFixed(1)}` });
    updated.volatilityPenalty = newPenalty;
  }

  // Sentiment weight
  const intelWins = last3.filter(t => t.intelBacked && t.outcome === 'WON').length;
  const intelTotal = last3.filter(t => t.intelBacked).length;
  if (intelTotal >= 2) {
    const intelRate = intelWins / intelTotal;
    if (intelRate > 0.65) {
      const newW = Math.min(1.5, updated.sentimentWeight + 0.1);
      lessons.push({ gen: updated.generation, ts: Date.now(), type: 'SENTIMENT', msg: `Sentiment weight increased: ${updated.sentimentWeight.toFixed(1)}→${newW.toFixed(1)} (intel-backed win rate ${(intelRate*100).toFixed(0)}%)` });
      updated.sentimentWeight = newW;
    } else if (intelRate < 0.35) {
      const newW = Math.max(0.5, updated.sentimentWeight - 0.1);
      lessons.push({ gen: updated.generation, ts: Date.now(), type: 'SENTIMENT', msg: `Sentiment weight decreased: ${updated.sentimentWeight.toFixed(1)}→${newW.toFixed(1)} (intel-backed win rate ${(intelRate*100).toFixed(0)}%)` });
      updated.sentimentWeight = newW;
    }
  }

  // Domain weights
  const domainStats = {};
  resolved.forEach(t => {
    if (!t.domain) return;
    if (!domainStats[t.domain]) domainStats[t.domain] = { wins: 0, total: 0 };
    domainStats[t.domain].total++;
    if (t.outcome === 'WON') domainStats[t.domain].wins++;
  });
  const newDomainWeights = { ...updated.domainWeights };
  Object.entries(domainStats).forEach(([domain, stats]) => {
    if (stats.total < 3) return;
    const dwr = stats.wins / stats.total;
    if (dwr > 0.6) {
      newDomainWeights[domain] = Math.min(1.5, (newDomainWeights[domain] || 1.0) + 0.1);
      lessons.push({ gen: updated.generation, ts: Date.now(), type: 'DOMAIN', msg: `${domain} weight +0.1 → ${newDomainWeights[domain].toFixed(1)} (${(dwr*100).toFixed(0)}% win rate)` });
    } else if (dwr < 0.35) {
      newDomainWeights[domain] = Math.max(0.5, (newDomainWeights[domain] || 1.0) - 0.1);
      lessons.push({ gen: updated.generation, ts: Date.now(), type: 'DOMAIN', msg: `${domain} weight -0.1 → ${newDomainWeights[domain].toFixed(1)} (${(dwr*100).toFixed(0)}% win rate)` });
    }
  });
  updated.domainWeights = newDomainWeights;

  // Append lessons
  updated.lessons = [...lessons, ...(brain.lessons || [])].slice(0, 100);

  // Check tier evolution
  updated = evolveTier(updated);

  return updated;
}
