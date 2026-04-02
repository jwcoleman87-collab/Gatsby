const BRAIN_KEY    = 'gatsby-brain';
const TRADES_KEY   = 'gatsby-trades';
const ACTIVITY_KEY = 'gatsby-activity';

export function loadBrain() {
  try {
    const raw = localStorage.getItem(BRAIN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveBrain(brain) {
  try { localStorage.setItem(BRAIN_KEY, JSON.stringify(brain)); } catch {}
}

export function loadTrades() {
  try {
    const raw = localStorage.getItem(TRADES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveTrades(trades) {
  try { localStorage.setItem(TRADES_KEY, JSON.stringify(trades)); } catch {}
}

export function loadActivity() {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveActivity(activity) {
  try { localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity.slice(0, 500))); } catch {}
}
