import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '..', 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
};

function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"
  };
}

async function serveFile(res, filePath, statusCode = 200) {
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const body = await readFile(filePath);

  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': process.env.NODE_ENV === 'production' ? 'public, max-age=3600' : 'no-store',
    ...securityHeaders()
  });
  res.end(body);
}

function json(res, code, payload) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    ...securityHeaders()
  });
  res.end(JSON.stringify(payload));
}

export function createApp() {
  return createServer(async (req, res) => {
    const requestPath = new URL(req.url, 'http://localhost').pathname;

    if (requestPath === '/healthz') {
      return json(res, 200, {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    }

    const normalizedPath = requestPath === '/' ? '/index.html' : requestPath;
    const filePath = path.normalize(path.join(publicDir, normalizedPath));

    if (!filePath.startsWith(publicDir)) {
      return json(res, 400, { error: 'invalid_path' });
    }

    try {
      await serveFile(res, filePath);
    } catch {
      try {
        await serveFile(res, path.join(publicDir, 'index.html'));
      } catch {
        json(res, 500, { error: 'server_error' });
      }
    }

    return undefined;
  });
}

if (import.meta.url === `file://${process.argv[1]}` && process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT || 3000);
  const server = createApp();
  server.listen(port, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`ProTrade X running on http://0.0.0.0:${port}`);
  });
}
