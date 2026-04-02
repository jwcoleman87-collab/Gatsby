import React from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const card = { background: '#0d0d1a', border: '1px solid #1a1a2e', borderRadius: 8, padding: '14px 16px', marginBottom: 12 };

export default function IntelPanel({ intel }) {
  if (!intel) return <div style={{ color: '#555', padding: 32, textAlign: 'center' }}>Loading intel...</div>;

  const fng = intel.fng;
  const fngColor = fng ? (fng.value <= 25 ? '#00ff88' : fng.value <= 45 ? '#88cc44' : fng.value <= 55 ? '#888' : fng.value <= 75 ? '#ffaa00' : '#ff4444') : '#888';
  const fngData = (intel.fngTrend || []).map((v, i) => ({ day: i, value: v })).reverse();

  const sentimentColor = (s) => s > 2 ? '#00ff88' : s > 0 ? '#88cc44' : s > -2 ? '#ffaa00' : '#ff4444';

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Top row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
        {/* Fear & Greed */}
        <div style={{ ...card, borderColor: fngColor + '44' }}>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>FEAR & GREED INDEX</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ ...mono, fontSize: 36, fontWeight: 700, color: fngColor }}>{fng?.value ?? '—'}</span>
            <span style={{ fontSize: 12, color: fngColor }}>{fng?.label || ''}</span>
          </div>
          {fngData.length > 1 && (
            <div style={{ height: 40, marginTop: 8 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fngData}>
                  <Line type="monotone" dataKey="value" stroke={fngColor} strokeWidth={2} dot={false} />
                  <Tooltip contentStyle={{ background: '#0a0a15', border: '1px solid #1a1a2e', fontSize: 11 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* BTC Dominance */}
        <div style={card}>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>BTC DOMINANCE</div>
          <div style={{ ...mono, fontSize: 32, fontWeight: 700, color: '#f7931a' }}>{intel.btcDominance ?? '—'}%</div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>
            {intel.btcDominance > 60 ? '↑ BTC season' : intel.btcDominance < 40 ? '↓ Alt season' : '— Balanced'}
          </div>
        </div>

        {/* Market 24h */}
        <div style={card}>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>MARKET 24H</div>
          <div style={{ ...mono, fontSize: 28, fontWeight: 700, color: parseFloat(intel.totalMarketCapChange || 0) >= 0 ? '#00ff88' : '#ff4444' }}>
            {intel.totalMarketCapChange != null ? `${parseFloat(intel.totalMarketCapChange) >= 0 ? '+' : ''}${intel.totalMarketCapChange}%` : '—'}
          </div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>Total market cap change</div>
        </div>

        {/* DeFi Pools */}
        <div style={card}>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>DEFI POOLS</div>
          <div style={{ ...mono, fontSize: 32, fontWeight: 700, color: '#88cc44' }}>{intel.defiPoolCount || '—'}</div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>TVL &gt;$10M, APY 1-100%</div>
        </div>
      </div>

      {/* Macro signals */}
      {intel.macroSignals?.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 8 }}>MACRO SIGNALS</div>
          {intel.macroSignals.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ ...mono, fontSize: 10, padding: '2px 6px', borderRadius: 3, border: `1px solid ${s.type === 'DEFENSIVE' ? '#ff4444' : '#00ff88'}`, color: s.type === 'DEFENSIVE' ? '#ff4444' : '#00ff88' }}>{s.type}</span>
              <span style={{ fontSize: 12, color: '#aaa' }}>{s.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Trending coins */}
      {intel.trendingCoins?.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 8 }}>TRENDING COINS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {intel.trendingCoins.map(c => (
              <div key={c.id} style={{ background: '#0a0a15', borderRadius: 6, padding: '4px 10px', border: '1px solid #1a1a2e' }}>
                <span style={{ fontSize: 12, color: '#ff8844', fontWeight: 600 }}>{c.symbol?.toUpperCase()}</span>
                <span style={{ fontSize: 11, color: '#555', marginLeft: 6 }}>{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* News feed */}
      {intel.news?.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 8 }}>NEWS FEED</div>
          {intel.news.map((n, i) => (
            <div key={n.id || i} style={{ borderBottom: '1px solid #0f0f1f', paddingBottom: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#ccc', lineHeight: 1.4 }}>{n.title}</div>
                  <div style={{ fontSize: 10, color: '#444', marginTop: 3 }}>
                    {n.source} · {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : ''}
                  </div>
                </div>
                <div style={{ ...mono, fontSize: 12, fontWeight: 600, color: sentimentColor(n.sentiment), flexShrink: 0 }}>
                  {n.sentiment > 0 ? '+' : ''}{n.sentiment?.toFixed(1)}
                </div>
              </div>
              {n.alerts?.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                  {n.alerts.slice(0, 3).map((a, j) => (
                    <span key={j} style={{ fontSize: 9, color: a.level === 'CRITICAL' ? '#ff0033' : '#ffaa00', border: `1px solid ${a.level === 'CRITICAL' ? '#ff003344' : '#ffaa0033'}`, borderRadius: 3, padding: '1px 4px' }}>{a.text}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
