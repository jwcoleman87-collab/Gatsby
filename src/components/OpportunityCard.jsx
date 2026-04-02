import React, { useState } from 'react';
import { DOMAINS, SURVIVAL_WEIGHTS } from '../engine/constants';
import SignalBadge from './SignalBadge';
import ThreatBadge from './ThreatBadge';
import Sparkline from './Sparkline';
import ScoreBar from './ScoreBar';

const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const fmt = (n, d=2) => n != null ? n.toFixed(d) : '—';
const fmtAUD = (n) => n != null ? `A$${n.toFixed(2)}` : '—';

export default function OpportunityCard({ opp, onApprove, onDeny, autoResult }) {
  const [expanded, setExpanded] = useState(false);
  const domain = DOMAINS[opp.domain];
  const domainColor = domain?.color || '#888';

  const cardBg = '#0d0d1a';
  const borderColor = expanded ? domainColor + '66' : '#1a1a2e';

  const scoreColor = opp.totalScore >= 7 ? '#00ff88' : opp.totalScore >= 5 ? '#ffaa00' : '#ff4444';

  return (
    <div style={{
      background: cardBg,
      border: `1px solid ${borderColor}`,
      borderLeft: `3px solid ${domainColor}`,
      borderRadius: 8,
      padding: '12px 14px',
      cursor: 'pointer',
      transition: 'border-color 0.2s',
      position: 'relative',
    }}
      onClick={() => setExpanded(e => !e)}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: domainColor, fontWeight: 600 }}>{domain?.short}</span>
            <SignalBadge signal={opp.signal} small />
            {opp.threatLevel && opp.threatLevel !== 'CLEAR' && <ThreatBadge level={opp.threatLevel} />}
            {opp.isTrending && <span style={{ fontSize: 9, color: '#ff8844', border: '1px solid #ff884455', borderRadius: 3, padding: '1px 5px', ...mono }}>🔥 TRENDING</span>}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {opp.image && <img src={opp.image} alt="" style={{ width: 16, height: 16, borderRadius: '50%', marginRight: 6, verticalAlign: 'middle' }} />}
            {opp.name}
          </div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 1 }}>{opp.subtitle}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <div style={{ ...mono, fontSize: 18, fontWeight: 700, color: scoreColor }}>{fmt(opp.totalScore, 1)}</div>
          <div style={{ fontSize: 10, color: '#555' }}>/ 10</div>
          {opp.suggestedPosition > 0 && (
            <div style={{ ...mono, fontSize: 11, color: '#ffaa00' }}>{fmtAUD(opp.suggestedPosition)}</div>
          )}
        </div>
      </div>

      {/* Sparkline row */}
      {opp.sparkline && opp.sparkline.length > 2 && (
        <div style={{ margin: '8px 0 4px' }}>
          <Sparkline prices={opp.sparkline} width={180} height={32} />
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
        {opp.metrics?.price != null && (
          <span style={{ ...mono, fontSize: 11, color: '#888' }}>A${opp.metrics.price < 1 ? opp.metrics.price.toFixed(6) : opp.metrics.price.toFixed(2)}</span>
        )}
        {opp.metrics?.change24h != null && (
          <span style={{ ...mono, fontSize: 11, color: opp.metrics.change24h >= 0 ? '#00ff88' : '#ff4444' }}>
            {opp.metrics.change24h >= 0 ? '+' : ''}{fmt(opp.metrics.change24h, 1)}%
          </span>
        )}
        {opp.metrics?.apy != null && (
          <span style={{ ...mono, fontSize: 11, color: '#88cc44' }}>{fmt(opp.metrics.apy, 1)}% APY</span>
        )}
        {opp.metrics?.rsi != null && (
          <span style={{ ...mono, fontSize: 11, color: '#888' }}>RSI {fmt(opp.metrics.rsi, 0)}</span>
        )}
        <span style={{ ...mono, fontSize: 10, color: '#444' }}>{fmt(opp.signalStrength, 0)}% strength</span>
      </div>

      {/* Auto-execution status */}
      {autoResult && (
        <div style={{
          marginTop: 6,
          fontSize: 10,
          ...mono,
          color: autoResult.executed ? '#00ff88' : '#444',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {autoResult.executed ? '⚡ AUTO-EXECUTED' : `⏸ ${autoResult.reason}`}
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div style={{ marginTop: 12, borderTop: '1px solid #1a1a2e', paddingTop: 12 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Key metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginBottom: 12 }}>
            {Object.entries(opp.metrics || {}).map(([k, v]) => {
              if (typeof v !== 'number') return null;
              return (
                <div key={k} style={{ background: '#0a0a15', borderRadius: 6, padding: '6px 8px' }}>
                  <div style={{ fontSize: 9, color: '#444', marginBottom: 2 }}>{k.toUpperCase()}</div>
                  <div style={{ ...mono, fontSize: 12, color: '#aaa' }}>{typeof v === 'number' ? v.toFixed(3) : v}</div>
                </div>
              );
            })}
          </div>

          {/* Alerts */}
          {opp.alerts && opp.alerts.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>INTEL ALERTS</div>
              {opp.alerts.map((a, i) => (
                <div key={i} style={{ fontSize: 11, color: a.level === 'CRITICAL' ? '#ff0033' : a.level === 'SEVERE' ? '#ff4444' : a.level?.startsWith('CATALYST') ? '#00ff88' : '#ffaa00', marginBottom: 2 }}>
                  {a.text}
                </div>
              ))}
            </div>
          )}

          {/* Reasoning */}
          {opp.reasoning && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>REASONING</div>
              {opp.reasoning.map((r, i) => (
                <div key={i} style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>• {r}</div>
              ))}
            </div>
          )}

          {/* Score bars */}
          {opp.dims && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>SURVIVAL FRAMEWORK</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                {Object.entries(opp.dims).map(([k, v]) => (
                  <ScoreBar key={k} label={k} value={v} />
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => onApprove(opp)} style={{
              flex: 1, padding: '12px 0', borderRadius: 8, border: '1px solid #00ff88',
              background: 'transparent', color: '#00ff88', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', minHeight: 46, ...mono
            }}>✓ APPROVE</button>
            <button onClick={() => onDeny(opp)} style={{
              flex: 1, padding: '12px 0', borderRadius: 8, border: '1px solid #ff4444',
              background: 'transparent', color: '#ff4444', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', minHeight: 46, ...mono
            }}>✗ DENY</button>
          </div>
        </div>
      )}
    </div>
  );
}
