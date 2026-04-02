import React from 'react';
import { TIERS } from '../engine/constants';

const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const card = { background: '#0d0d1a', border: '1px solid #1a1a2e', borderRadius: 8, padding: '14px 16px', marginBottom: 12 };

function Param({ label, value, unit }) {
  return (
    <div style={{ background: '#0a0a15', borderRadius: 6, padding: '8px 10px' }}>
      <div style={{ fontSize: 10, color: '#444', marginBottom: 3 }}>{label}</div>
      <div style={{ ...mono, fontSize: 14, color: '#e0e0e0' }}>{value}<span style={{ fontSize: 10, color: '#555', marginLeft: 2 }}>{unit}</span></div>
    </div>
  );
}

export default function BrainPanel({ brain, trades }) {
  if (!brain) return <div style={{ color: '#555', padding: 32, textAlign: 'center' }}>Brain loading...</div>;

  const currentTier = TIERS.find(t => t.tier === brain.tier) || TIERS[0];
  const nextTier = TIERS.find(t => t.tier === brain.tier + 1);
  const totalResolved = trades.filter(t => t.outcome);
  const winRate = totalResolved.length ? (brain.totalWins / totalResolved.length * 100) : 0;

  // Domain win rates
  const domainStats = {};
  totalResolved.forEach(t => {
    if (!t.domain) return;
    if (!domainStats[t.domain]) domainStats[t.domain] = { wins: 0, total: 0 };
    domainStats[t.domain].total++;
    if (t.outcome === 'WON') domainStats[t.domain].wins++;
  });

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Tier card */}
      <div style={{ ...card, borderColor: brain.tier >= 3 ? '#00ff8844' : '#1a1a2e' }}>
        <div style={{ fontSize: 10, color: '#555', marginBottom: 8 }}>TRUST TIER</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
          {TIERS.map(t => (
            <div key={t.tier} style={{ textAlign: 'center' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', border: `2px solid ${brain.tier >= t.tier ? '#00ff88' : '#1a1a2e'}`,
                background: brain.tier === t.tier ? '#00ff8822' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                ...mono, fontSize: 11, color: brain.tier >= t.tier ? '#00ff88' : '#333',
                fontWeight: 700,
              }}>T{t.tier}</div>
              <div style={{ fontSize: 9, color: brain.tier === t.tier ? '#00ff88' : '#333', marginTop: 4 }}>{t.name}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ ...mono, fontSize: 11, color: '#888' }}>Auto limit: <span style={{ color: '#ffaa00' }}>A${currentTier.autoLimit}</span></span>
          <span style={{ ...mono, fontSize: 11, color: '#888' }}>Auto wins: <span style={{ color: '#00ff88' }}>{brain.autoWins}</span></span>
          <span style={{ ...mono, fontSize: 11, color: '#888' }}>Win rate: <span style={{ color: winRate >= 55 ? '#00ff88' : '#ffaa00' }}>{winRate.toFixed(0)}%</span></span>
          {brain.circuitBreakerTripped && <span style={{ ...mono, fontSize: 11, color: '#ff0033', border: '1px solid #ff003344', padding: '1px 6px', borderRadius: 3 }}>⚠ CIRCUIT BREAKER TRIPPED</span>}
        </div>
        {nextTier && (
          <div style={{ fontSize: 11, color: '#444' }}>
            Next tier: {nextTier.wins_needed || nextTier.winsNeeded} auto wins + {(nextTier.minWinRate * 100).toFixed(0)}% win rate needed
          </div>
        )}
      </div>

      {/* Adaptive parameters */}
      <div style={card}>
        <div style={{ fontSize: 10, color: '#555', marginBottom: 10 }}>ADAPTIVE PARAMETERS  <span style={{ color: '#333' }}>gen {brain.generation}</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
          <Param label="RSI Oversold" value={brain.rsiOversold} />
          <Param label="RSI Overbought" value={brain.rsiOverbought} />
          <Param label="Max Position" value={(brain.maxPositionPct * 100).toFixed(0)} unit="%" />
          <Param label="Auto Min Score" value={brain.autoMinScore} unit="/10" />
          <Param label="Vol Penalty" value={brain.volatilityPenalty?.toFixed(2)} unit="x" />
          <Param label="Sentiment Wt" value={brain.sentimentWeight?.toFixed(2)} unit="x" />
          <Param label="Auto Max" value={`A$${brain.autoMaxAmount}`} />
          <Param label="Circuit Limit" value={brain.circuitBreakerLimit} unit=" losses" />
        </div>
      </div>

      {/* Domain weights */}
      <div style={card}>
        <div style={{ fontSize: 10, color: '#555', marginBottom: 10 }}>DOMAIN PERFORMANCE WEIGHTS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
          {Object.entries(brain.domainWeights || {}).map(([domain, weight]) => {
            const stats = domainStats[domain] || { wins: 0, total: 0 };
            const dr = stats.total > 0 ? (stats.wins / stats.total * 100).toFixed(0) : null;
            return (
              <div key={domain} style={{ background: '#0a0a15', borderRadius: 6, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>{domain}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ ...mono, fontSize: 14, color: weight > 1 ? '#00ff88' : weight < 1 ? '#ff4444' : '#888' }}>{weight.toFixed(2)}x</span>
                  {dr !== null && <span style={{ fontSize: 10, color: '#555' }}>{dr}% WR</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lessons */}
      {brain.lessons?.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 10 }}>LESSONS LEARNED</div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {brain.lessons.map((l, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid #0f0f1f' }}>
                <span style={{ ...mono, fontSize: 10, color: '#333', flexShrink: 0 }}>gen{l.gen}</span>
                <span style={{ fontSize: 11, color: '#00ff88', flexShrink: 0, minWidth: 80 }}>[{l.type}]</span>
                <span style={{ fontSize: 11, color: '#888' }}>{l.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
