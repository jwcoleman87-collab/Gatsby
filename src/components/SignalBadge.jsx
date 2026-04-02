import React from 'react';
import { SIGNAL_COLORS } from '../engine/constants';

export default function SignalBadge({ signal, small }) {
  const color = SIGNAL_COLORS[signal] || '#555';
  const label = signal === 'BLOCKED' ? '⛔ BLOCKED' : signal;
  return (
    <span style={{
      display: 'inline-block',
      padding: small ? '2px 6px' : '3px 8px',
      borderRadius: 4,
      border: `1px solid ${color}`,
      color,
      fontSize: small ? 9 : 10,
      fontFamily: "'IBM Plex Mono', monospace",
      fontWeight: 600,
      letterSpacing: '0.05em',
      whiteSpace: 'nowrap',
      lineHeight: 1.4,
    }}>
      {label}
    </span>
  );
}
