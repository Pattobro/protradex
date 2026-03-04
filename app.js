const chartEl = document.getElementById('chart');
const ctx = chartEl.getContext('2d');
const symbolEl = document.getElementById('symbol');
const priceEl = document.getElementById('last-price');
const changeEl = document.getElementById('price-change');
const stockHackerEl = document.getElementById('stock-hacker');
const optionHackerEl = document.getElementById('option-hacker');
const greeksEl = document.getElementById('greeks');

document.getElementById('year').textContent = new Date().getFullYear();

const symbols = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN'];
let candles = Array.from({ length: 48 }, (_, idx) => {
  const base = 180 + idx * 0.12;
  return {
    o: base + Math.random() * 1.8,
    h: base + 1.8 + Math.random() * 2,
    l: base - 1.6 - Math.random() * 1.4,
    c: base + (Math.random() - 0.5) * 2.6
  };
});

function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * absX);
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-(absX ** 2));
  return sign * y;
}

function normalCdf(x) {
  return (1 + erf(x / Math.sqrt(2))) / 2;
}

function blackScholes(S, K, T, r, sigma) {
  const d1 = (Math.log(S / K) + (r + sigma ** 2 / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const call = S * normalCdf(d1) - K * Math.exp(-r * T) * normalCdf(d2);
  const delta = normalCdf(d1);
  const gamma = Math.exp(-(d1 ** 2) / 2) / (S * sigma * Math.sqrt(2 * Math.PI * T));
  const vega = (S * Math.exp(-(d1 ** 2) / 2) * Math.sqrt(T)) / Math.sqrt(2 * Math.PI) / 100;
  const theta =
    (-S * Math.exp(-(d1 ** 2) / 2) * sigma / (2 * Math.sqrt(2 * Math.PI * T)) -
      r * K * Math.exp(-r * T) * normalCdf(d2)) /
    365;

  return { call, delta, gamma, vega, theta };
}

function drawChart() {
  const { width, height } = chartEl;
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = '#1f2a3f';

  for (let i = 1; i < 5; i += 1) {
    const y = (height / 5) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const max = Math.max(...candles.map((c) => c.h));
  const min = Math.min(...candles.map((c) => c.l));
  const scaleY = (price) => height - ((price - min) / (max - min || 1)) * (height - 12) - 6;
  const gap = width / candles.length;

  candles.forEach((candle, i) => {
    const x = i * gap + gap / 2;
    const openY = scaleY(candle.o);
    const closeY = scaleY(candle.c);
    const highY = scaleY(candle.h);
    const lowY = scaleY(candle.l);
    const isUp = candle.c >= candle.o;

    ctx.strokeStyle = isUp ? '#20d67b' : '#ff5c6c';
    ctx.fillStyle = isUp ? '#20d67b' : '#ff5c6c';

    ctx.beginPath();
    ctx.moveTo(x, highY);
    ctx.lineTo(x, lowY);
    ctx.stroke();

    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.max(Math.abs(openY - closeY), 2);
    ctx.fillRect(x - 3, bodyTop, 6, bodyHeight);
  });
}

function updateMarket() {
  const prevClose = candles[candles.length - 1].c;
  const drift = (Math.random() - 0.49) * 2.2;
  const open = prevClose;
  const close = prevClose + drift;
  const high = Math.max(open, close) + Math.random() * 1.2;
  const low = Math.min(open, close) - Math.random() * 1.2;
  candles = [...candles.slice(1), { o: open, h: high, l: low, c: close }];

  const pct = ((close - candles[0].o) / candles[0].o) * 100;
  const activeSymbol = symbols[Math.floor(Math.random() * symbols.length)];
  symbolEl.textContent = activeSymbol;
  priceEl.textContent = `$${close.toFixed(2)}`;
  changeEl.textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
  changeEl.className = pct >= 0 ? 'up' : 'down';

  drawChart();
  fillScanners(close);
  fillGreeks(close);
}

function fillScanners(spot) {
  const stocks = Array.from({ length: 6 }, () => ({
    symbol: symbols[Math.floor(Math.random() * symbols.length)],
    momentum: `${(Math.random() * 12 - 2).toFixed(2)}%`,
    volume: `${(Math.random() * 8 + 1).toFixed(1)}M`
  }));

  stockHackerEl.innerHTML = stocks
    .map((s) => `<tr><td>${s.symbol}</td><td>${s.momentum}</td><td>${s.volume}</td></tr>`)
    .join('');

  const options = Array.from({ length: 6 }, (_, i) => {
    const strike = Math.round(spot + (i - 2) * 5);
    return {
      contract: `${symbolEl.textContent} ${strike}C`,
      iv: `${(28 + Math.random() * 44).toFixed(1)}%`,
      oi: `${Math.round(Math.random() * 1900 + 100)}`
    };
  });

  optionHackerEl.innerHTML = options
    .map((o) => `<tr><td>${o.contract}</td><td>${o.iv}</td><td>${o.oi}</td></tr>`)
    .join('');
}

function fillGreeks(spot) {
  const { call, delta, gamma, vega, theta } = blackScholes(spot, Math.round(spot), 45 / 365, 0.04, 0.3);
  const cards = [
    ['Call Price', `$${call.toFixed(2)}`],
    ['Delta', delta.toFixed(3)],
    ['Gamma', gamma.toFixed(4)],
    ['Vega', vega.toFixed(3)],
    ['Theta', theta.toFixed(3)]
  ];

  greeksEl.innerHTML = cards
    .map(([k, v]) => `<div class="card"><small>${k}</small><strong>${v}</strong></div>`)
    .join('');
}

updateMarket();
setInterval(updateMarket, 1600);
