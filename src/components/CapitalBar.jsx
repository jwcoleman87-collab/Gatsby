import React from 'react';

const mono = { fontFamily: "'IBM Plex Mono', monospace" };

export default function CapitalBar({ capital, trades, oppsCount, scanning }) {
  const deployed = trades.filter(t => !t.outcome).reduce((s, t) => s + (t.amount || 0), 0);
  const free = Math.max(0, capital - deployed);
  const totalResolved = trades.filter(t => t.outcome);
  const wins = totalResolved.filter(t => t.outcome === 'WON').length;
  const winRate = totalResolved.length > 0 ? (wins / totalResolved.length * 100) : 0;

  const stat = (label, val, color) => (
    <div style={{ textAlign: 'center', minWidth: 100 }}>
      <div style={{ fontSize: 11, color: '#555', marginBottom: 2 }}>{label}</div>
      <div style={{ ...mono, fontSize: 15, fontWeight: 600, color }}>{val}</div>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: '#0d0d1a',
      border: '1px solid #1a1a2e',
      borderRadius: 8,
      padding: '10px 20px',
      marginBottom: 16,
      flexWrap: 'wrap',
      gap: 8,
    }}>
      {stat('CAPITAL', `A$${capital.toFixed(0)}`, '#e0e0e0')}
      <div style={{ width: 1, height: 32, background: '#1a1a2e' }} />
      {stat('DEPLOYED', `A$${deployed.toFixed(0)}`, '#ffaa00')}
      <div style={{ width: 1, height: 32, background: '#1a1a2e' }} />
      {stat('FREE', `A$${free.toFixed(0)}`, free < 50 ? '#ff4444' : '#00ff88')}
      <div style={{ width: 1, height: 32, background: '#1a1a2e' }} />
      {stat('WIN RATE', `${winRate.toFixed(0)}%`, winRate >= 55 ? '#00ff88' : winRate >= 40 ? '#ffaa00' : '#ff4444')}
      <div style={{ width: 1, height: 32, background: '#1a1a2e' }} />
      {stat('OPPS', oppsCount, '#888')}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: scanning ? '#00ff88' : '#ff4444',
          boxShadow: scanning ? '0 0 6px #00ff88' : 'none',
          animation: scanning ? 'pulse-dot 2s infinite' : 'none',
        }} />
        <span style={{ fontSize: 11, color: scanning ? '#00ff88' : '#ff4444', ...mono }}>
          {scanning ? 'SCANNING' : 'STOPPED'}
        </span>
      </div>
      <style>{`@keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
