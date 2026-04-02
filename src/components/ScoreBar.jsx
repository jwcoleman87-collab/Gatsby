import React from 'react';

export default function ScoreBar({ label, value, max = 10 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const color = pct >= 70 ? '#00ff88' : pct >= 45 ? '#ffaa00' : '#ff4444';
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontSize: 10, color: '#888', fontFamily: "'Outfit', sans-serif" }}>{label}</span>
        <span style={{ fontSize: 10, color, fontFamily: "'IBM Plex Mono', monospace" }}>{value.toFixed(1)}</span>
      </div>
      <div style={{ height: 3, background: '#1a1a2e', borderRadius: 2 }}>
        <div style={{ height: 3, width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}
