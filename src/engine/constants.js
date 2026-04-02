export const DOMAINS = {
  MARKETS:    { id: 'MARKETS',    label: '📈 MARKETS',    color: '#00ff88', short: '📈' },
  YIELD:      { id: 'YIELD',      label: '🌱 YIELD',      color: '#88cc44', short: '🌱' },
  ARBITRAGE:  { id: 'ARBITRAGE',  label: '⚡ ARBITRAGE',  color: '#00ddff', short: '⚡' },
  TRENDS:     { id: 'TRENDS',     label: '🔥 TRENDS',     color: '#ff8844', short: '🔥' },
  DIGITAL:    { id: 'DIGITAL',    label: '💎 DIGITAL',    color: '#cc66ff', short: '💎' },
  MACRO:      { id: 'MACRO',      label: '🌐 MACRO',      color: '#ffaa00', short: '🌐' },
};

export const SIGNAL_COLORS = {
  'STRONG BUY':  '#00ff88',
  'BUY':         '#44dd88',
  'LEAN BUY':    '#88cc66',
  'HOLD':        '#555555',
  'WATCH':       '#ffaa00',
  'SELL':        '#ff6644',
  'STRONG SELL': '#ff2244',
  'BLOCKED':     '#ff0033',
};

export const SURVIVAL_WEIGHTS = {
  downsideRisk:       0.22,
  failureProbability: 0.16,
  speedToCash:        0.12,
  recoveryIfWrong:    0.10,
  capitalRequired:    0.10,
  repeatability:      0.08,
  intelligence:       0.06,
  scalability:        0.04,
  defensibility:      0.04,
  dependencyRisk:     0.04,
  knowledgeGained:    0.04,
};

export const YIELD_SOURCES = [
  { id: 'eth-staking',    name: 'ETH Staking',         subtitle: 'Lido / Rocket Pool',       apy: 3.5,  risk: 'LOW',      category: 'staking',   protocol: 'Lido',    chain: 'Ethereum' },
  { id: 'usdc-lending',   name: 'USDC Lending',         subtitle: 'Aave / Compound',          apy: 5.5,  risk: 'LOW',      category: 'lending',   protocol: 'Aave',    chain: 'Ethereum' },
  { id: 'btc-savings',    name: 'BTC Savings',          subtitle: 'CEX Savings Programs',     apy: 2.5,  risk: 'MODERATE', category: 'savings',   protocol: 'CEX',     chain: 'BTC' },
  { id: 'lp-uni',         name: 'Liquidity Provision',  subtitle: 'Uniswap / Curve',          apy: 12.0, risk: 'HIGH',     category: 'lp',        protocol: 'Uniswap', chain: 'Ethereum' },
  { id: 'aud-hys',        name: 'AUD High-Yield Savings',subtitle: 'AU Banks (~4-5%)',        apy: 4.5,  risk: 'MINIMAL',  category: 'savings',   protocol: 'Bank',    chain: 'AUD' },
  { id: 'covered-calls',  name: 'Covered Calls',        subtitle: 'IB / Deribit Options',     apy: 8.0,  risk: 'MODERATE', category: 'options',   protocol: 'Deribit', chain: 'Options' },
];

export const ARBITRAGE_TYPES = [
  { id: 'cex-gap',       name: 'CEX Price Gaps',          subtitle: 'Same coin, diff exchange',    difficulty: 'MODERATE', speed: 'FAST',   capitalReq: 'MEDIUM', description: 'Buy low on one exchange, sell high on another within seconds' },
  { id: 'stablecoin',    name: 'Stablecoin Depeg',         subtitle: 'Buy below $1, wait for repeg', difficulty: 'LOW',     speed: 'MEDIUM', capitalReq: 'MEDIUM', description: 'Acquire stablecoin below peg, hold until restoration' },
  { id: 'funding-rate',  name: 'Funding Rate Arb',         subtitle: 'Perp futures vs spot',        difficulty: 'HIGH',    speed: 'SLOW',   capitalReq: 'HIGH',   description: 'Capture perpetual funding payments vs spot position' },
  { id: 'cross-chain',   name: 'Cross-Chain Bridge Gaps',  subtitle: 'Price differences across L1/L2', difficulty: 'HIGH', speed: 'FAST',   capitalReq: 'HIGH',   description: 'Exploit price inefficiencies across blockchain networks' },
  { id: 'new-listing',   name: 'New Listing Premium',      subtitle: 'Fresh listing price discovery', difficulty: 'MODERATE', speed: 'FAST', capitalReq: 'LOW',  description: 'Trade initial volatility on newly listed assets' },
  { id: 'carry-trade',   name: 'AUD/USD Carry Trade',      subtitle: 'Interest rate differential',  difficulty: 'LOW',     speed: 'SLOW',   capitalReq: 'MEDIUM', description: 'Exploit AUD vs USD interest rate spread' },
];

export const TREND_SIGNALS = [
  { id: 'google-trends',    name: 'Google Trends Crypto',    subtitle: 'Spiking search interest',     icon: '🔍' },
  { id: 'reddit-sentiment', name: 'Reddit Sentiment',         subtitle: 'Rising mention frequency',    icon: '👾' },
  { id: 'github-activity',  name: 'GitHub Dev Activity',      subtitle: 'Increasing commits',          icon: '💻' },
  { id: 'app-store',        name: 'App Store Rankings',       subtitle: 'Trading apps rising',         icon: '📱' },
  { id: 'domain-regs',      name: 'Domain Registrations',     subtitle: 'Spikes around topic',         icon: '🌐' },
  { id: 'job-postings',     name: 'Job Postings',             subtitle: 'Companies hiring in crypto',  icon: '💼' },
  { id: 'patent-filings',   name: 'Patent Filings',           subtitle: 'Blockchain/fintech patents',  icon: '📄' },
  { id: 'regulatory',       name: 'Regulatory Filings',       subtitle: 'ETF applications, licenses',  icon: '🏛️' },
];

export const DIGITAL_OPPS = [
  { id: 'domain-flip',   name: 'Trending Domain Flipping',   subtitle: 'Buy & sell premium domains',    icon: '🌐' },
  { id: 'digital-prod',  name: 'Digital Product Gaps',        subtitle: 'Unmet demand for digital tools', icon: '📦' },
  { id: 'api-service',   name: 'API Service Opportunities',   subtitle: 'Monetize data endpoints',       icon: '🔌' },
  { id: 'content-gap',   name: 'Content Supply/Demand Gaps',  subtitle: 'High-demand, low-supply topics', icon: '✍️' },
];

export const TIERS = [
  { tier: 1, name: 'CAUTION', autoLimit: 22,  winsNeeded: 0,  minWinRate: 0.00 },
  { tier: 2, name: 'TESTED',  autoLimit: 44,  winsNeeded: 10, minWinRate: 0.50 },
  { tier: 3, name: 'PROVEN',  autoLimit: 82,  winsNeeded: 25, minWinRate: 0.55 },
  { tier: 4, name: 'TRUSTED', autoLimit: 137, winsNeeded: 50, minWinRate: 0.58 },
];
