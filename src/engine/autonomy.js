export function shouldAutoExecute(opp, brain, capital, existingTrades) {
  const reasons = [];

  if (brain.circuitBreakerTripped) {
    return { execute: false, reason: 'Circuit breaker tripped' };
  }

  if (opp.domain !== 'MARKETS') {
    return { execute: false, reason: `Auto-exec: MARKETS only` };
  }

  const buySignals = ['STRONG BUY', 'BUY', 'LEAN BUY'];
  if (!buySignals.includes(opp.signal)) {
    return { execute: false, reason: `Signal ${opp.signal} not a buy` };
  }

  if (opp.threatLevel === 'CRITICAL' || opp.threatLevel === 'SEVERE') {
    return { execute: false, reason: `Threat level ${opp.threatLevel}` };
  }

  if (opp.totalScore < brain.autoMinScore) {
    return { execute: false, reason: `Score ${opp.totalScore} < min ${brain.autoMinScore}` };
  }

  if (opp.suggestedPosition > brain.autoMaxAmount) {
    return { execute: false, reason: `Position A$${opp.suggestedPosition} > tier limit A$${brain.autoMaxAmount}` };
  }

  if (opp.suggestedPosition <= 0) {
    return { execute: false, reason: 'Position size is $0' };
  }

  const deployed = existingTrades
    .filter(t => !t.outcome)
    .reduce((s, t) => s + (t.amount || 0), 0);
  const free = capital - deployed;

  if (free < 50) {
    return { execute: false, reason: `Free capital A$${free.toFixed(0)} < A$50` };
  }

  if (opp.suggestedPosition > free * 0.30) {
    return { execute: false, reason: `Would exceed 30% of free capital` };
  }

  // Check if already have an open trade for this asset
  const alreadyOpen = existingTrades.some(
    t => !t.outcome && t.oppId === opp.id
  );
  if (alreadyOpen) {
    return { execute: false, reason: 'Already have open position' };
  }

  return { execute: true, reason: 'All checks passed' };
}
