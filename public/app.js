const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');

const indicatorGrid = document.getElementById('indicatorGrid');
const stockSignals = document.getElementById('stockSignals');
const optionSignals = document.getElementById('optionSignals');
const greekGrid = document.getElementById('greekGrid');
const themeToggle = document.getElementById('themeToggle');

const state = {
  candles: Array.from({ length: 60 }, (_, i) => {
    const base = 100 + i * 0.2 + (Math.random() - 0.5) * 1.5;
    const open = base + (Math.random() - 0.5) * 0.8;
    const close = base + (Math.random() - 0.5) * 1.2;
    const high = Math.max(open, close) + Math.random() * 0.9;
    const low = Math.min(open, close) - Math.random() * 0.9;
    return { open, close, high, low };
  })
};

function sma(period = 14) {
  const prices = state.candles.map((c) => c.close);
  const window = prices.slice(-period);
  return window.reduce((sum, n) => sum + n, 0) / window.length;
}

function rsi(period = 14) {
  const closes = state.candles.map((c) => c.close);
  let gain = 0;
  let loss = 0;

  for (let i = closes.length - period; i < closes.length; i += 1) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gain += diff;
    else loss -= diff;
  }

  if (!loss) return 100;
  const rs = gain / loss;
  return 100 - 100 / (1 + rs);
}

function latestPrice() {
  return state.candles.at(-1).close;
}

function blackScholesGreeks() {
  const spot = latestPrice();
  const strike = 105;
  const t = 30 / 365;
  const r = 0.045;
  const vol = 0.32;
  const d1 = (Math.log(spot / strike) + (r + vol * vol * 0.5) * t) / (vol * Math.sqrt(t));
  const d2 = d1 - vol * Math.sqrt(t);

  return {
    Delta: 0.5 + Math.atan(d1) / Math.PI,
    Gamma: Math.exp(-(d1 * d1) / 2) / (spot * vol * Math.sqrt(2 * Math.PI * t)),
    Theta: -((spot * vol) / (2 * Math.sqrt(t))) * 0.01,
    Vega: spot * Math.sqrt(t) * Math.exp(-(d1 * d1) / 2) * 0.01,
    Rho: strike * t * Math.exp(-r * t) * (0.5 + Math.atan(d2) / Math.PI) * 0.01
  };
}

function renderMetricGrid(node, entries) {
  node.innerHTML = entries
    .map(
      ([label, value]) => `
      <article class="metric">
        <div class="label">${label}</div>
        <div class="value">${value}</div>
      </article>
    `
    )
    .join('');
}

function renderSignals(node, rows) {
  node.innerHTML = rows
    .map(
      ({ name, score, direction }) => `
      <li class="signal-item">
        <span>${name}</span>
        <strong class="${direction}">${score}</strong>
      </li>
    `
    )
    .join('');
}

function drawCandles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const min = Math.min(...state.candles.map((c) => c.low));
  const max = Math.max(...state.candles.map((c) => c.high));
  const scaleY = (price) => canvas.height - ((price - min) / (max - min)) * (canvas.height - 20) - 10;

  state.candles.forEach((candle, i) => {
    const x = i * (canvas.width / state.candles.length) + 8;
    const candleWidth = 10;
    const up = candle.close >= candle.open;
    const color = up ? '#29d0ba' : '#fe557a';

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + candleWidth / 2, scaleY(candle.high));
    ctx.lineTo(x + candleWidth / 2, scaleY(candle.low));
    ctx.stroke();

    ctx.fillStyle = color;
    const bodyTop = scaleY(Math.max(candle.open, candle.close));
    const bodyBottom = scaleY(Math.min(candle.open, candle.close));
    ctx.fillRect(x, bodyTop, candleWidth, Math.max(2, bodyBottom - bodyTop));
  });
}

function nextCandle() {
  const prev = state.candles.at(-1);
  const open = prev.close;
  const close = open + (Math.random() - 0.48) * 1.5;
  const high = Math.max(open, close) + Math.random() * 0.8;
  const low = Math.min(open, close) - Math.random() * 0.8;

  state.candles.push({ open, close, high, low });
  if (state.candles.length > 65) state.candles.shift();
}

function render() {
  const greeks = blackScholesGreeks();
  const rsiValue = rsi();

  drawCandles();

  renderMetricGrid(indicatorGrid, [
    ['SMA (14)', sma().toFixed(2)],
    ['RSI (14)', rsiValue.toFixed(2)],
    ['Last Trade', latestPrice().toFixed(2)],
    ['Momentum', rsiValue > 55 ? 'Bullish' : rsiValue < 45 ? 'Bearish' : 'Neutral']
  ]);

  renderSignals(stockSignals, [
    { name: 'NVDA breakout scan', score: `+${(Math.random() * 3 + 2).toFixed(1)}%`, direction: 'up' },
    { name: 'MSFT volume anomaly', score: `-${(Math.random() * 2).toFixed(1)}%`, direction: 'down' },
    { name: 'AAPL trend continuation', score: `+${(Math.random() * 2 + 1).toFixed(1)}%`, direction: 'up' }
  ]);

  renderSignals(optionSignals, [
    { name: 'SPY 30D IV rank', score: `${(Math.random() * 25 + 55).toFixed(0)}th`, direction: 'up' },
    { name: 'QQQ call skew', score: `${(Math.random() * 8 + 4).toFixed(1)}%`, direction: 'up' },
    { name: 'IWM put demand', score: `${(Math.random() * 10 + 2).toFixed(1)}%`, direction: 'down' }
  ]);

  renderMetricGrid(
    greekGrid,
    Object.entries(greeks).map(([name, value]) => [name, Number(value).toFixed(4)])
  );
}

themeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('light');
});

render();
setInterval(() => {
  nextCandle();
  render();
}, 1500);
