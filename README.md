# ProTrade X v1.3.0

Institutional Trading Platform Simulator, now packaged as a deployable web application.

## Highlights

- Live candlestick simulation rendered on canvas
- SMA + RSI indicators
- Stock Hacker and Option Hacker signal panels
- Black-Scholes-inspired Greeks dashboard
- Responsive institutional multi-panel interface
- Production-friendly Node.js server with strict security headers, cache controls, and health checks

## Requirements

- Node.js 20+
- npm 10+

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production run

```bash
npm install --omit=dev
npm start
```

Environment variables:

- `PORT` (default: `3000`)
- `NODE_ENV` (set to `production` in prod)

## Validation

```bash
npm run lint
npm test
```

## Health endpoint

- `GET /healthz` returns runtime status payload for orchestration probes.
