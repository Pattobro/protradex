const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3000;
const root = __dirname;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function send(res, status, content, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': status === 200 ? 'public, max-age=86400' : 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  });
  res.end(content);
}

function resolvePath(urlPath) {
  const cleaned = path.normalize(decodeURIComponent(urlPath)).replace(/^\.+/, '');
  const filePath = path.join(root, cleaned === '/' ? 'index.html' : cleaned);
  if (!filePath.startsWith(root)) return null;
  return filePath;
}

const server = http.createServer((req, res) => {
  const reqPath = req.url ? req.url.split('?')[0] : '/';

  if (reqPath === '/health') {
    const payload = JSON.stringify({ status: 'ok', uptime: process.uptime() });
    return send(res, 200, payload, 'application/json; charset=utf-8');
  }

  const requested = resolvePath(reqPath);
  if (!requested) return send(res, 400, 'Bad request');

  let filePath = requested;
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(root, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 500, 'Internal server error');
    const ext = path.extname(filePath).toLowerCase();
    return send(res, 200, data, mime[ext] || 'application/octet-stream');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`ProTrade X website running on http://localhost:${PORT}`);
});
