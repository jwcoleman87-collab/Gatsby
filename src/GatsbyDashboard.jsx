import React, { useState, useEffect, useCallback, useRef } from 'react';

import { DOMAINS, YIELD_SOURCES, ARBITRAGE_TYPES, TREND_SIGNALS, DIGITAL_OPPS } from './engine/constants';
import { DEFAULT_BRAIN, evolveBrain } from './engine/brain';
import { fetchAllIntel, buildIntelReport } from './engine/intelligence';
import {
  scoreMarketOpp, scoreYieldOpp, scoreDefiPool,
  scoreArbitrageOpp, scoreTrendOpp, scoreDigitalOpp, buildMacroInsights,
} from './engine/scoring';
import { shouldAutoExecute } from './engine/autonomy';
import { loadBrain, saveBrain, loadTrades, saveTrades, loadActivity, saveActivity } from './engine/storage';

import CapitalBar from './components/CapitalBar';
import OpportunityCard from './components/OpportunityCard';
import StopButton from './components/StopButton';
import StoppedOverlay from './components/StoppedOverlay';
import IntelPanel from './components/IntelPanel';
import BrainPanel from './components/BrainPanel';
import TradePanel from './components/TradePanel';
import ActivityLog from './components/ActivityLog';

const CAPITAL = 550;
const SCAN_INTERVAL = 120_000;
const mono = { fontFamily: "'IBM Plex Mono', monospace" };

const TABS = [
  { id: 'hunt',   label: '🌍 HUNT' },
  { id: 'intel',  label: '📡 INTEL' },
  { id: 'brain',  label: '🧠 BRAIN' },
  { id: 'trades', label: '📋 TRADES' },
  { id: 'log',    label: '📜 LOG' },
];

const DOMAIN_FILTERS = [
  { id: 'ALL', label: 'ALL' },
  { id: 'MARKETS',   label: '📈 MARKETS' },
  { id: 'YIELD',     label: '🌱 YIELD' },
  { id: 'ARBITRAGE', label: '⚡ ARBITRAGE' },
  { id: 'TRENDS',    label: '🔥 TRENDS' },
  { id: 'DIGITAL',   label: '💎 DIGITAL' },
  { id: 'MACRO',     label: '🌐 MACRO' },
];

const SIGNAL_FILTERS = ['ALL', 'STRONG BUY', 'BUY', 'LEAN BUY', 'WATCH', 'HOLD', 'SELL', 'BLOCKED'];

function addActivity(prev, type, message, amount) {
  const entry = { type, message, timestamp: Date.now(), amount };
  const updated = [entry, ...prev].slice(0, 500);
  saveActivity(updated);
  return updated;
}

function generateTradeId() {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function GatsbyDashboard() {
  const [tab, setTab] = useState('hunt');
  const [brain, setBrain] = useState(() => {
    const saved = loadBrain();
    return saved || { ...DEFAULT_BRAIN };
  });
  const [trades, setTrades] = useState(() => loadTrades());
  const [activity, setActivity] = useState(() => loadActivity());
  const [opps, setOpps] = useState([]);
  const [intel, setIntel] = useState(null);
  const [rawIntel, setRawIntel] = useState(null);
  const [stopped, setStopped] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [autoResults, setAutoResults] = useState({});
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [signalFilter, setSignalFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('score');

  const stoppedRef = useRef(stopped);
  const brainRef = useRef(brain);
  const tradesRef = useRef(trades);
  const activityRef = useRef(activity);

  useEffect(() => { stoppedRef.current = stopped; }, [stopped]);
  useEffect(() => { brainRef.current = brain; }, [brain]);
  useEffect(() => { tradesRef.current = trades; }, [trades]);
  useEffect(() => { activityRef.current = activity; }, [activity]);

  // ── Core scan loop ──────────────────────────────────────────────────────────

  const runScan = useCallback(async () => {
    if (stoppedRef.current) return;
    setScanning(true);

    try {
      const raw = await fetchAllIntel();
      setRawIntel(raw);
      const report = buildIntelReport(raw);
      setIntel(report);

      const currentBrain = brainRef.current;
      const currentTrades = tradesRef.current;
      const newOpps = [];
      const newAutoResults = {};

      // Markets
      if (raw.markets && Array.isArray(raw.markets)) {
        raw.markets.forEach(coin => {
          const opp = scoreMarketOpp(coin, report, currentBrain, CAPITAL);
          if (opp) newOpps.push(opp);
        });
      }

      // Yield — static sources
      YIELD_SOURCES.forEach(src => {
        const opp = scoreYieldOpp(src, currentBrain, CAPITAL, null);
        if (opp) newOpps.push(opp);
      });

      // Yield — DefiLlama live pools (top 10 by APY after filtering)
      if (raw.yields?.data) {
        const filtered = raw.yields.data
          .filter(p => p.tvlUsd > 10_000_000 && p.apy > 1 && p.apy < 100)
          .sort((a, b) => b.apy - a.apy)
          .slice(0, 10);
        filtered.forEach(pool => {
          const opp = scoreDefiPool(pool, currentBrain, CAPITAL);
          if (opp) newOpps.push(opp);
        });
      }

      // Arbitrage
      ARBITRAGE_TYPES.forEach(type => {
        const opp = scoreArbitrageOpp(type, currentBrain, CAPITAL, raw.exchanges);
        if (opp) newOpps.push(opp);
      });

      // Trends
      TREND_SIGNALS.forEach(sig => {
        const opp = scoreTrendOpp(sig, currentBrain, report);
        if (opp) newOpps.push(opp);
      });

      // Digital
      DIGITAL_OPPS.forEach(d => {
        const opp = scoreDigitalOpp(d, currentBrain, CAPITAL);
        if (opp) newOpps.push(opp);
      });

      // Macro
      const macroOpps = buildMacroInsights(report, currentBrain, CAPITAL);
      macroOpps.forEach(o => newOpps.push(o));

      // Auto-execution
      let updatedTrades = [...currentTrades];
      let updatedActivity = [...activityRef.current];
      let updatedBrain = { ...currentBrain };

      const autoEligible = newOpps.filter(o => ['STRONG BUY', 'BUY', 'LEAN BUY'].includes(o.signal) && o.domain === 'MARKETS');

      autoEligible.forEach(opp => {
        const check = shouldAutoExecute(opp, updatedBrain, CAPITAL, updatedTrades);
        newAutoResults[opp.id] = { executed: check.execute, reason: check.reason };

        if (check.execute) {
          const trade = {
            id: generateTradeId(),
            oppId: opp.id,
            domain: opp.domain,
            name: opp.name,
            subtitle: opp.subtitle,
            signal: opp.signal,
            amount: opp.suggestedPosition,
            auto: true,
            timestamp: Date.now(),
            outcome: null,
            metrics: opp.metrics,
            intelBacked: (opp.alerts?.length || 0) > 0,
          };
          updatedTrades = [...updatedTrades, trade];
          updatedActivity = addActivity(updatedActivity, 'AUTO_EXEC',
            `${opp.name} — ${opp.signal} (score ${opp.totalScore}/10)`, opp.suggestedPosition);
        } else if (opp.signal !== 'HOLD' && opp.signal !== 'WATCH') {
          updatedActivity = addActivity(updatedActivity, 'AUTO_SKIP',
            `${opp.name} — skipped: ${check.reason}`);
        }
      });

      // Block log
      newOpps.filter(o => o.signal === 'BLOCKED').forEach(opp => {
        updatedActivity = addActivity(updatedActivity, 'BLOCKED',
          `${opp.name} — BLOCKED by ${opp.threatLevel} threat`);
      });

      setOpps(newOpps);
      setAutoResults(newAutoResults);
      setTrades(updatedTrades);
      setActivity(updatedActivity);
      setLastScan(new Date());
      saveTrades(updatedTrades);

      // Brain evolution
      const resolvedCount = updatedTrades.filter(t => t.outcome).length;
      if (resolvedCount > 0 && resolvedCount % 3 === 0) {
        const evolved = evolveBrain(updatedBrain, updatedTrades);
        if (evolved.generation !== updatedBrain.generation) {
          setBrain(evolved);
          saveBrain(evolved);
        }
      } else {
        saveBrain(updatedBrain);
      }

    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setScanning(false);
    }
  }, []);

  // Initial scan + interval
  useEffect(() => {
    runScan();
    const interval = setInterval(() => {
      if (!stoppedRef.current) runScan();
    }, SCAN_INTERVAL);
    return () => clearInterval(interval);
  }, [runScan]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleStop = () => {
    setStopped(true);
    setActivity(prev => addActivity(prev, 'STOP', 'Emergency stop activated — all scanning paused'));
  };

  const handleResume = () => {
    setStopped(false);
    setActivity(prev => addActivity(prev, 'RESUME', 'Scanning resumed'));
    setTimeout(runScan, 100);
  };

  const handleApprove = (opp) => {
    const trade = {
      id: generateTradeId(),
      oppId: opp.id,
      domain: opp.domain,
      name: opp.name,
      subtitle: opp.subtitle,
      signal: opp.signal,
      amount: opp.suggestedPosition || 10,
      auto: false,
      timestamp: Date.now(),
      outcome: null,
      metrics: opp.metrics,
      intelBacked: (opp.alerts?.length || 0) > 0,
    };
    setTrades(prev => {
      const updated = [...prev, trade];
      saveTrades(updated);
      return updated;
    });
    setActivity(prev => addActivity(prev, 'MANUAL_EXEC',
      `${opp.name} — manually approved (${opp.signal})`, opp.suggestedPosition));
  };

  const handleDeny = (opp) => {
    setActivity(prev => addActivity(prev, 'DENIED', `${opp.name} — manually denied`));
  };

  const handleResolve = (tradeId, outcome) => {
    setTrades(prevTrades => {
      const updated = prevTrades.map(t => t.id === tradeId ? { ...t, outcome, resolvedAt: Date.now() } : t);
      saveTrades(updated);

      const trade = updated.find(t => t.id === tradeId);
      if (trade) {
        setActivity(prev => addActivity(prev, 'RESOLVED',
          `${trade.name} — ${outcome} (A$${trade.amount?.toFixed(2)})`, trade.amount));

        setBrain(prevBrain => {
          const isWin = outcome === 'WON';
          let newBrain = {
            ...prevBrain,
            totalWins: isWin ? prevBrain.totalWins + 1 : prevBrain.totalWins,
            totalLosses: !isWin ? prevBrain.totalLosses + 1 : prevBrain.totalLosses,
            consecutiveLosses: isWin ? 0 : prevBrain.consecutiveLosses + 1,
            autoWins: (isWin && trade.auto) ? prevBrain.autoWins + 1 : prevBrain.autoWins,
          };
          if (newBrain.consecutiveLosses >= newBrain.circuitBreakerLimit) {
            newBrain.circuitBreakerTripped = true;
            setActivity(prev => addActivity(prev, 'BLOCKED', `Circuit breaker tripped after ${newBrain.consecutiveLosses} consecutive losses`));
          }
          if (isWin && prevBrain.circuitBreakerTripped) {
            newBrain.circuitBreakerTripped = false;
            newBrain.consecutiveLosses = 0;
          }

          // Evolve every 3 resolved
          const resolvedCount = updated.filter(t => t.outcome).length;
          if (resolvedCount > 0 && resolvedCount % 3 === 0) {
            newBrain = evolveBrain(newBrain, updated);
          }

          saveBrain(newBrain);
          return newBrain;
        });
      }
      return updated;
    });
  };

  // ── Filtering & sorting ──────────────────────────────────────────────────────

  const displayOpps = opps
    .filter(o => domainFilter === 'ALL' || o.domain === domainFilter)
    .filter(o => {
      if (signalFilter === 'ALL') return true;
      if (signalFilter === 'BLOCKED') return o.signal === 'BLOCKED';
      return o.signal === signalFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.totalScore - a.totalScore;
      if (sortBy === 'signal') {
        const order = { 'STRONG BUY': 0, 'BUY': 1, 'LEAN BUY': 2, 'WATCH': 3, 'HOLD': 4, 'SELL': 5, 'STRONG SELL': 6, 'BLOCKED': 7 };
        return (order[a.signal] ?? 5) - (order[b.signal] ?? 5);
      }
      if (sortBy === 'net') return (b.suggestedPosition || 0) - (a.suggestedPosition || 0);
      return 0;
    });

  // ── Render ──────────────────────────────────────────────────────────────────

  const pendingCount = trades.filter(t => !t.outcome).length;

  return (
    <div style={{ minHeight: '100vh', background: '#07070f', color: '#e0e0e0', fontFamily: "'Outfit', sans-serif" }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', borderBottom: '1px solid #1a1a2e',
        background: '#0a0a15', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ ...mono, fontSize: 18, fontWeight: 700, color: '#00ff88', letterSpacing: '0.08em' }}>GATSBY</span>
          <span style={{ ...mono, fontSize: 10, color: '#333', letterSpacing: '0.05em' }}>v0.5</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: stopped ? '#ff0033' : '#00ff88', boxShadow: stopped ? 'none' : '0 0 6px #00ff88' }} />
            <span style={{ ...mono, fontSize: 10, color: stopped ? '#ff0033' : '#00ff88' }}>{stopped ? '◻ STOPPED' : '◉ LIVE'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {lastScan && <span style={{ ...mono, fontSize: 10, color: '#333' }}>last scan {lastScan.toLocaleTimeString()}</span>}
          {scanning && <span style={{ ...mono, fontSize: 10, color: '#ffaa00' }}>● scanning...</span>}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1a1a2e', background: '#0a0a15', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 20px', background: 'transparent',
            border: 'none', borderBottom: `2px solid ${tab === t.id ? '#00ff88' : 'transparent'}`,
            color: tab === t.id ? '#00ff88' : '#555', cursor: 'pointer',
            fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
            fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap',
            transition: 'color 0.15s',
          }}>
            {t.label}
            {t.id === 'trades' && pendingCount > 0 && (
              <span style={{ marginLeft: 6, background: '#ffaa00', color: '#000', borderRadius: 10, fontSize: 9, padding: '1px 5px', fontWeight: 700, ...mono }}>{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={{ padding: '16px 24px', maxWidth: 1400, margin: '0 auto' }}>

        <CapitalBar capital={CAPITAL} trades={trades} oppsCount={opps.length} scanning={scanning && !stopped} />

        {/* HUNT tab */}
        {tab === 'hunt' && (
          <div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Domain pills */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {DOMAIN_FILTERS.map(df => (
                  <button key={df.id} onClick={() => setDomainFilter(df.id)} style={{
                    padding: '4px 10px', borderRadius: 16, border: `1px solid ${domainFilter === df.id ? '#00ff88' : '#1a1a2e'}`,
                    background: domainFilter === df.id ? '#00ff8820' : 'transparent',
                    color: domainFilter === df.id ? '#00ff88' : '#555',
                    fontSize: 11, cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                    transition: 'all 0.15s',
                  }}>{df.label}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Signal filter */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {SIGNAL_FILTERS.map(sf => (
                  <button key={sf} onClick={() => setSignalFilter(sf)} style={{
                    padding: '3px 8px', borderRadius: 12, border: `1px solid ${signalFilter === sf ? '#888' : '#1a1a2e'}`,
                    background: signalFilter === sf ? '#88888820' : 'transparent',
                    color: signalFilter === sf ? '#e0e0e0' : '#444',
                    fontSize: 10, cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace",
                    transition: 'all 0.15s',
                  }}>{sf}</button>
                ))}
              </div>

              {/* Sort */}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                {['score', 'signal', 'net'].map(s => (
                  <button key={s} onClick={() => setSortBy(s)} style={{
                    padding: '3px 8px', borderRadius: 4, border: `1px solid ${sortBy === s ? '#444' : '#1a1a2e'}`,
                    background: sortBy === s ? '#1a1a2e' : 'transparent',
                    color: sortBy === s ? '#aaa' : '#333',
                    fontSize: 10, cursor: 'pointer', ...mono,
                  }}>↕ {s}</button>
                ))}
              </div>
            </div>

            {/* Cards grid */}
            {displayOpps.length === 0 && (
              <div style={{ color: '#333', textAlign: 'center', padding: '48px', fontSize: 14 }}>
                {scanning ? 'Scanning...' : 'No opportunities match filters'}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {displayOpps.map(opp => (
                <OpportunityCard
                  key={opp.id}
                  opp={opp}
                  onApprove={handleApprove}
                  onDeny={handleDeny}
                  autoResult={autoResults[opp.id]}
                />
              ))}
            </div>
          </div>
        )}

        {tab === 'intel' && <IntelPanel intel={intel} />}
        {tab === 'brain' && <BrainPanel brain={brain} trades={trades} />}
        {tab === 'trades' && <TradePanel trades={trades} onResolve={handleResolve} />}
        {tab === 'log' && <ActivityLog activity={activity} />}

      </div>

      {/* Fixed UI */}
      <StoppedOverlay stopped={stopped} />
      <StopButton stopped={stopped} onStop={handleStop} onResume={handleResume} />
    </div>
  );
}
