'use strict';

const http = require('http');

const FIXTURES = {
  campaigns: require('../fixtures/campaigns.json'),
  insights: require('../fixtures/insights.json'),
  oauthError: require('../fixtures/error-oauth.json'),
};

/**
 * Boots a throwaway HTTP server that impersonates graph.facebook.com, so the CLI
 * can be exercised end to end with no access token and no outbound network call.
 *
 * handler({ method, path, query }) -> { status, body | raw, delayMs }
 */
function startMockMeta(handler = () => ({ status: 200, body: { data: [] } })) {
  const requests = [];

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const request = {
      method: req.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
    };
    requests.push(request);

    const result = handler(request) || {};
    const send = () => {
      const body = result.raw !== undefined ? result.raw : JSON.stringify(result.body ?? {});
      res.writeHead(result.status || 200, { 'content-type': 'application/json' });
      res.end(body);
    };

    if (result.delayMs) setTimeout(send, result.delayMs);
    else send();
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        url: `http://127.0.0.1:${port}`,
        requests,
        fixture: FIXTURES,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

module.exports = { startMockMeta, FIXTURES };
