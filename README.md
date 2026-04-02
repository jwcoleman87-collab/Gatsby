# Gatsby v0.5 — Multi-Domain Survival Engine

## Quick Start

```
npm install
npm start
```

Your browser will open to http://localhost:3000

## Access from iPad (or any device on the same WiFi)

1. Run `npm start` on your computer as normal
2. Find your computer's local IP address:
   - **Windows**: open Command Prompt → type `ipconfig` → look for **IPv4 Address** (e.g. `192.168.1.42`)
   - **Mac**: System Settings → Wi-Fi → Details → IP Address
3. On your iPad, open Safari and go to: `http://192.168.1.42:3000`
   *(replace with your actual IP)*

Both devices must be on the **same WiFi network**. The `.env.development` file
already sets `HOST=0.0.0.0` so the app listens on all network interfaces.

## What it does

Gatsby scans 6 domains of financial opportunity every 2 minutes:
- 📈 MARKETS — Top 50 crypto assets (CoinGecko)
- 🌱 YIELD — DeFi yield pools + static yield sources
- ⚡ ARBITRAGE — 6 arbitrage opportunity types
- 🔥 TRENDS — 8 trend signal monitors
- 💎 DIGITAL — Digital opportunity types
- 🌐 MACRO — Macro environment signals

## Features

- Survival-first scoring on 11 dimensions
- Threat detection from news headlines
- Auto-execution within earned trust limits
- Circuit breaker (pauses after 3 consecutive losses)
- Learning engine that evolves parameters every 3 resolved trades
- Emergency STOP button (bottom right, always visible)
- All data persists via localStorage

## Capital

Starting capital: A$550 AUD  
Auto-execution starts at Tier 1 (max A$22 per trade)
