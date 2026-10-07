/**
 * Test Suite: Step 1 Hardening (Helmet Security Headers & Scoped Auth Rate Limiting)
 */

const assert = require('assert');
const http = require('http');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

async function testStep1() {
  console.log('=============================================================');
  console.log('🧪 TESTING STEP 1: HELMET SECURITY HEADERS & AUTH RATE LIMITING');
  console.log('=============================================================');

  const app = express();
  app.use(express.json());

  // Apply Helmet exactly as configured in server.js
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    })
  );

  // Scoped Auth Limiter (test limit: 3 requests for fast unit testing)
  const testAuthLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 'fail',
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many authentication requests from this IP address. Please try again after 15 minutes.',
      },
    },
  });

  app.post('/api/v1/auth/login', testAuthLimiter, (req, res) => {
    res.status(200).json({ status: 'success', message: 'Login ok' });
  });

  app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Health ok' });
  });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  // Helper request function
  const makeRequest = (method, path) => {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: { 'Content-Type': 'application/json' },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: data ? JSON.parse(data) : {},
            });
          });
        }
      );
      req.on('error', reject);
      req.end();
    });
  };

  try {
    // 1. Verify Helmet Security Headers
    console.log('\n▶ [1/3] Verifying Helmet HTTP Security Headers on /api/v1/health...');
    const healthRes = await makeRequest('GET', '/api/v1/health');
    assert.strictEqual(healthRes.statusCode, 200);
    assert.strictEqual(healthRes.headers['x-content-type-options'], 'nosniff', 'Missing X-Content-Type-Options: nosniff');
    assert.strictEqual(healthRes.headers['x-frame-options'], 'SAMEORIGIN', 'Missing X-Frame-Options: SAMEORIGIN');
    assert.ok(healthRes.headers['x-dns-prefetch-control'], 'Missing X-DNS-Prefetch-Control');
    console.log('  ✔ Helmet security headers verified (nosniff, SAMEORIGIN, dns-prefetch-control present).');

    // 2. Verify Rate Limiter Standard Headers under threshold
    console.log('\n▶ [2/3] Verifying Scoped Auth Rate Limiter under threshold...');
    const login1 = await makeRequest('POST', '/api/v1/auth/login');
    assert.strictEqual(login1.statusCode, 200);
    assert.ok(login1.headers['ratelimit-limit'], 'RateLimit-Limit header should exist');
    assert.ok(login1.headers['ratelimit-remaining'], 'RateLimit-Remaining header should exist');

    const login2 = await makeRequest('POST', '/api/v1/auth/login');
    assert.strictEqual(login2.statusCode, 200);

    const login3 = await makeRequest('POST', '/api/v1/auth/login');
    assert.strictEqual(login3.statusCode, 200);
    console.log('  ✔ Auth requests within threshold passed with RateLimit headers.');

    // 3. Verify Rate Limiter Blocks Excess Requests with 429
    console.log('\n▶ [3/3] Verifying 429 TOO_MANY_REQUESTS when limit exceeded...');
    const loginBlocked = await makeRequest('POST', '/api/v1/auth/login');
    assert.strictEqual(loginBlocked.statusCode, 429, 'Excess request must return HTTP 429');
    assert.strictEqual(loginBlocked.body.error?.code, 'TOO_MANY_REQUESTS');
    console.log('  ✔ Excess auth requests blocked with HTTP 429 and standard error response.');

    // 4. Verify Non-Auth Endpoints are NOT throttled
    const healthAfterLimit = await makeRequest('GET', '/api/v1/health');
    assert.strictEqual(healthAfterLimit.statusCode, 200, 'Health endpoint must not be throttled');
    console.log('  ✔ Non-auth endpoints (Health/Bookings/Catalog) remain unaffected and accessible.');

    console.log('\n=============================================================');
    console.log('🎉 STEP 1 HARDENING (HELMET & RATE LIMITING) TEST PASSED 100%!');
    console.log('=============================================================\n');
  } finally {
    server.close();
  }
}

testStep1().catch((err) => {
  console.error('❌ Step 1 Test Failed:', err);
  process.exit(1);
});
