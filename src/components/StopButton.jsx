import React from 'react';

export default function StopButton({ stopped, onStop, onResume }) {
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 1000 }}>
      <button
        onClick={stopped ? onResume : onStop}
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          border: 'none',
          background: stopped ? '#00bb55' : '#cc0022',
          color: '#fff',
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "'IBM Plex Mono', monospace",
          cursor: 'pointer',
          boxShadow: stopped ? '0 0 20px #00ff88aa' : '0 0 20px #ff003388',
          animation: stopped ? 'none' : 'stop-pulse 2s infinite',
          letterSpacing: '0.05em',
          transition: 'background 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <span style={{ fontSize: 22 }}>{stopped ? '▶' : '■'}</span>
        <span style={{ fontSize: 10 }}>{stopped ? 'RESUME' : 'STOP'}</span>
      </button>
      <style>{`
        @keyframes stop-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px #ff003388; }
          50% { transform: scale(1.06); box-shadow: 0 0 32px #ff0033cc; }
        }
      `}</style>
    </div>
  );
}
