# ProTrade X v1.3.1

Institutional Trading Platform Simulator — now packaged as a production-ready website.

## What this includes

- Live candlestick chart simulation
- SMA/RSI-style momentum workflow representation
- Stock Hacker and Option Hacker scanner tables
- Black-Scholes Greeks engine preview
- Responsive multi-panel institutional layout
- Production Node.js HTTP server with:
  - Security-focused response headers
  - Safe static asset serving
  - SPA-style fallback routing
  - Health check endpoint

## Quick start

```bash
npm install
npm start
```

Then open [http://localhost:3000](http://localhost:3000).

## Health check

```bash
curl http://localhost:3000/health
```
