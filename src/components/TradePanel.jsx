import React from 'react';
import { DOMAINS } from '../engine/constants';
import SignalBadge from './SignalBadge';

const mono = { fontFamily: "'IBM Plex Mono', monospace" };

function TradeCard({ trade, onResolve }) {
  const domain = DOMAINS[trade.domain];
  const domainColor = domain?.color || '#888';
  const ts = new Date(trade.timestamp).toLocaleString();

  return (
    <div style={{
      background: '#0d0d1a',
      border: '1px solid #1a1a2e',
      borderLeft: `3px solid ${domainColor}`,
      borderRadius: 8,
      padding: '12px 14px',
      marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: domainColor }}>{domain?.short}</span>
            {trade.auto && <span style={{ ...mono, fontSize: 9, color: '#00ff88', border: '1px solid #00ff8844', borderRadius: 3, padding: '1px 5px' }}>⚡ AUTO</span>}
            {trade.real && <span style={{ ...mono, fontSize: 9, color: '#00ddff', border: '1px solid #00ddff44', borderRadius: 3, padding: '1px 5px' }}>💰 REAL</span>}
            <SignalBadge signal={trade.signal} small />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0' }}>{trade.name}</div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{trade.subtitle}</div>
          <div style={{ fontSize: 10, color: '#444', marginTop: 4, ...mono }}>{ts}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ ...mono, fontSize: 18, fontWeight: 700, color: '#ffaa00' }}>A${trade.amount?.toFixed(2)}</div>
          {trade.outcome ? (
            <div style={{ ...mono, fontSize: 12, color: trade.outcome === 'WON' ? '#00ff88' : '#ff4444', fontWeight: 700, marginTop: 4 }}>
              {trade.outcome === 'WON' ? '✓ WON' : '✗ LOST'}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button onClick={() => onResolve(trade.id, 'WON')} style={{
                padding: '10px 16px', borderRadius: 8, border: '1px solid #00ff88',
                background: 'transparent', color: '#00ff88', fontSize: 12, cursor: 'pointer', minHeight: 44, ...mono
              }}>✓ WON</button>
              <button onClick={() => onResolve(trade.id, 'LOST')} style={{
                padding: '10px 16px', borderRadius: 8, border: '1px solid #ff4444',
                background: 'transparent', color: '#ff4444', fontSize: 12, cursor: 'pointer', minHeight: 44, ...mono
              }}>✗ LOST</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TradePanel({ trades, onResolve }) {
  const pending = trades.filter(t => !t.outcome);
  const resolved = trades.filter(t => t.outcome).sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {pending.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 10, letterSpacing: '0.05em' }}>
            PENDING — {pending.length} OPEN
          </div>
          {pending.map(t => <TradeCard key={t.id} trade={t} onResolve={onResolve} />)}
        </div>
      )}
      {pending.length === 0 && (
        <div style={{ color: '#333', fontSize: 13, marginBottom: 24, padding: '24px', textAlign: 'center', border: '1px solid #1a1a2e', borderRadius: 8 }}>
          No pending trades
        </div>
      )}
      {resolved.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 10, letterSpacing: '0.05em' }}>
            HISTORY — {resolved.length} RESOLVED
          </div>
          {resolved.map(t => <TradeCard key={t.id} trade={t} onResolve={onResolve} />)}
        </div>
      )}
    </div>
  );
}
