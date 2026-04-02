import React from 'react';

export default function StoppedOverlay({ stopped }) {
  if (!stopped) return null;
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(200,0,0,0.12)',
      zIndex: 900,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        background: 'rgba(10,0,0,0.85)',
        border: '2px solid #ff0033',
        borderRadius: 12,
        padding: '24px 48px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🛑</div>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 28,
          fontWeight: 700,
          color: '#ff0033',
          letterSpacing: '0.1em',
        }}>STOPPED</div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>
          All scanning and auto-execution paused
        </div>
      </div>
    </div>
  );
}
