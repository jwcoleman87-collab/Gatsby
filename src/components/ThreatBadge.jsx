import React from 'react';

const THREAT_COLORS = {
  CLEAR:    '#00ff88',
  WARNING:  '#ffaa00',
  ELEVATED: '#ff8844',
  SEVERE:   '#ff4444',
  CRITICAL: '#ff0033',
};

export default function ThreatBadge({ level }) {
  if (!level || level === 'CLEAR') return null;
  const color = THREAT_COLORS[level] || '#ffaa00';
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 6px',
      borderRadius: 4,
      border: `1px solid ${color}`,
      color,
      fontSize: 9,
      fontFamily: "'IBM Plex Mono', monospace",
      fontWeight: 700,
      letterSpacing: '0.05em',
    }}>
      ⚠ {level}
    </span>
  );
}
