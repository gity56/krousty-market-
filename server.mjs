import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';

const PORT = Number(process.env.PORT || 3001);
const REVIEW_WINDOW_MS = 10 * 60 * 1000;
const SCRAPER_TIMEOUT_MS = 4 * 60 * 1000;
const MAPS_URL = 'https://maps.app.goo.gl/6Nnff6RjLSPY4F3x7?g_st=ic';

const scraperDir = resolve(
  process.env.GOOGLE_REVIEW_SCRAPER_DIR ||
    'C:/Users/User/Desktop/projects/googleavis/google-review-agent/google_reviews_scraper',
);
const reviewsPath = join(scraperDir, 'reviews.json');
const sessions = new Map();

function readReviewIds() {
  if (!existsSync(reviewsPath)) return new Set();

  try {
    const reviews = JSON.parse(readFileSync(reviewsPath, 'utf8'));
    if (!Array.isArray(reviews)) return new Set();
    return new Set(
      reviews
        .map((review) => review?.review_id)
        .filter((reviewId) => typeof reviewId === 'string' && reviewId.length > 0),
    );
  } catch {
    return new Set();
  }
}

function runScraper() {
  return new Promise((resolvePromise, rejectPromise) => {
    const python = process.env.PYTHON || 'python';
    const child = spawn(python, ['main.py'], {
      cwd: scraperDir,
      env: {
        ...process.env,
        GOOGLE_MAPS_URL: MAPS_URL,
        OUTPUT_FILE: reviewsPath,
        MAX_REVIEWS: process.env.MAX_REVIEWS || '100',
        HEADLESS: process.env.HEADLESS || 'true',
      },
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill();
      rejectPromise(new Error('La verification Google Maps a pris trop de temps.'));
    }, SCRAPER_TIMEOUT_MS);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    child.on('error', (error) => {
      clearTimeout(timeout);
      rejectPromise(error);
    });
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolvePromise({ stdout, stderr });
        return;
      }
      rejectPromise(new Error(stderr || stdout || `Le scraper a termine avec le code ${code}.`));
    });
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  response.end(JSON.stringify(payload));
}

async function handleStart(response) {
  const id = randomUUID();
  const now = Date.now();
  sessions.set(id, {
    baselineIds: readReviewIds(),
    deadline: now + REVIEW_WINDOW_MS,
    verified: false,
    checking: null,
  });

  sendJson(response, 200, {
    id,
    mapsUrl: MAPS_URL,
    deadline: now + REVIEW_WINDOW_MS,
  });
}

async function handleCheck(response, requestUrl) {
  const id = requestUrl.searchParams.get('id');
  const session = id ? sessions.get(id) : null;

  if (!session) {
    sendJson(response, 404, { verified: false, error: 'Session introuvable.' });
    return;
  }

  if (session.verified) {
    sendJson(response, 200, { verified: true, expired: false });
    return;
  }

  if (Date.now() > session.deadline) {
    sessions.delete(id);
    sendJson(response, 200, { verified: false, expired: true });
    return;
  }

  if (!session.checking) {
    session.checking = runScraper()
      .then(() => {
        const currentIds = readReviewIds();
        const newIds = [...currentIds].filter((reviewId) => !session.baselineIds.has(reviewId));
        session.verified = newIds.length > 0;
        return { newCount: newIds.length };
      })
      .finally(() => {
        session.checking = null;
      });
  }

  try {
    const result = await session.checking;
    sendJson(response, 200, {
      verified: session.verified,
      expired: false,
      newCount: result.newCount,
      remainingMs: Math.max(0, session.deadline - Date.now()),
    });
  } catch (error) {
    sendJson(response, 500, {
      verified: false,
      expired: false,
      error: error instanceof Error ? error.message : 'Verification impossible.',
    });
  }
}

function serveStatic(response, pathname) {
  const distPath = resolve('dist');
  const requestedPath = pathname === '/' ? 'index.html' : pathname.slice(1);
  const filePath = resolve(distPath, requestedPath);
  const fallbackPath = join(distPath, 'index.html');
  const targetPath = filePath.startsWith(distPath) && existsSync(filePath) ? filePath : fallbackPath;

  if (!existsSync(targetPath)) {
    sendJson(response, 404, { error: 'Build introuvable. Lance npm run build avant npm start.' });
    return;
  }

  const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
  };

  response.writeHead(200, {
    'Content-Type': contentTypes[extname(targetPath)] || 'application/octet-stream',
  });
  createReadStream(targetPath).pipe(response);
}

createServer(async (request, response) => {
  const requestUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api/review-gate/start') {
    await handleStart(response);
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/review-gate/check') {
    await handleCheck(response, requestUrl);
    return;
  }

  serveStatic(response, requestUrl.pathname);
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Review gate server running on http://127.0.0.1:${PORT}`);
});
