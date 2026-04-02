import React from 'react';

const mono = { fontFamily: "'IBM Plex Mono', monospace" };

const TYPE_COLORS = {
  AUTO_EXEC:   '#00aaff',
  MANUAL_EXEC: '#00ff88',
  AUTO_SKIP:   '#444',
  BLOCKED:     '#ff0033',
  RESOLVED:    '#ffaa00',
  STOP:        '#ff0033',
  RESUME:      '#00ff88',
  DENIED:      '#ff4444',
  TIER_UP:     '#00aaff',
  SCAN:        '#333',
};

export default function ActivityLog({ activity }) {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ background: '#0d0d1a', border: '1px solid #1a1a2e', borderRadius: 8, padding: '14px 16px' }}>
        <div style={{ fontSize: 10, color: '#555', marginBottom: 10 }}>ACTIVITY LOG — {activity.length} ENTRIES</div>
        {activity.length === 0 && (
          <div style={{ color: '#333', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No activity yet</div>
        )}
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {activity.map((entry, i) => {
            const color = TYPE_COLORS[entry.type] || '#555';
            const ts = new Date(entry.timestamp).toLocaleTimeString();
            return (
              <div key={i} style={{
                display: 'flex',
                gap: 10,
                padding: '5px 0',
                borderBottom: '1px solid #0a0a15',
                alignItems: 'flex-start',
              }}>
                <span style={{ ...mono, fontSize: 10, color: '#333', flexShrink: 0, minWidth: 70 }}>{ts}</span>
                <span style={{ ...mono, fontSize: 10, color, flexShrink: 0, minWidth: 100, fontWeight: 600 }}>{entry.type}</span>
                <span style={{ fontSize: 11, color: '#666', flex: 1 }}>{entry.message}</span>
                {entry.amount && <span style={{ ...mono, fontSize: 10, color: '#ffaa00', flexShrink: 0 }}>A${entry.amount?.toFixed(2)}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
