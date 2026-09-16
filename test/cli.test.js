'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { startMockMeta } = require('./helpers/mock-meta-server.js');
const { runCli } = require('./helpers/run-cli.js');

const TOKEN = 'test-token-not-a-secret';
const ACCOUNT = 'act_123456789';

async function withServer(handler, fn) {
  const server = await startMockMeta(handler);
  try {
    await fn(server);
  } finally {
    await server.close();
  }
}

function envFor(server, extra = {}) {
  return {
    META_ACCESS_TOKEN: TOKEN,
    META_API_BASE_URL: server.url,
    META_API_VERSION: undefined,
    META_ACCOUNT_ID: undefined,
    ...extra,
  };
}

test('prints help with no arguments', async () => {
  const result = await runCli([]);
  assert.equal(result.status, 0);
  assert.ok(result.json.commands.getInsights);
  assert.equal(result.json.environment.defaults.apiVersion, 'v26.0');
});

test('rejects an unknown command with exit code 1', async () => {
  const result = await runCli(['deleteEverything']);
  assert.equal(result.status, 1);
  assert.match(result.json.error, /Unknown command/);
  assert.deepEqual(result.json.available, ['getCampaigns', 'getInsights', 'testConnection']);
});

test('fails fast and offline when no access token is set', async () => {
  await withServer(undefined, async (server) => {
    const result = await runCli(['testConnection'], envFor(server, { META_ACCESS_TOKEN: undefined }));
    assert.equal(result.status, 1);
    assert.match(result.json.error, /META_ACCESS_TOKEN is required/);
    assert.equal(server.requests.length, 0, 'no request should be sent without a token');
  });
});

test('testConnection hits the versioned /me endpoint and reports the version', async () => {
  await withServer(
    () => ({ status: 200, body: { id: '42', name: 'Ad Account Owner' } }),
    async (server) => {
      const result = await runCli(['testConnection'], envFor(server));
      assert.equal(result.status, 0);
      assert.equal(result.json.connected, true);
      assert.equal(result.json.apiVersion, 'v26.0');
      assert.equal(result.json.user.name, 'Ad Account Owner');

      const [request] = server.requests;
      assert.equal(request.path, '/v26.0/me');
      assert.equal(request.query.fields, 'id,name');
      assert.equal(request.query.access_token, TOKEN);
    },
  );
});

test('getCampaigns returns campaigns for the flag account id', async () => {
  await withServer(
    () => ({ status: 200, body: server_campaigns() }),
    async (server) => {
      const result = await runCli(['getCampaigns', `--accountId=${ACCOUNT}`, '--datePreset=last_7d'], envFor(server));
      assert.equal(result.status, 0);
      assert.equal(result.json.count, 2);
      assert.equal(result.json.campaigns[0].name, 'Search — Brand');
      assert.equal(result.json.datePreset, 'last_7d');

      const [request] = server.requests;
      assert.equal(request.path, `/v26.0/${ACCOUNT}/campaigns`);
      assert.equal(request.query.date_preset, 'last_7d');
      assert.equal(request.query.limit, '100');
      assert.match(request.query.fields, /daily_budget/);
    },
  );
});

test('getCampaigns falls back to META_ACCOUNT_ID', async () => {
  await withServer(
    () => ({ status: 200, body: server_campaigns() }),
    async (server) => {
      const result = await runCli(['getCampaigns'], envFor(server, { META_ACCOUNT_ID: ACCOUNT }));
      assert.equal(result.status, 0);
      assert.equal(server.requests[0].path, `/v26.0/${ACCOUNT}/campaigns`);
      assert.equal(server.requests[0].query.date_preset, 'last_30d');
    },
  );
});

test('getCampaigns without any account id fails with a clear message', async () => {
  const result = await runCli(['getCampaigns'], { META_ACCESS_TOKEN: TOKEN, META_ACCOUNT_ID: undefined });
  assert.equal(result.status, 1);
  assert.match(result.json.error, /accountId is required/);
});

test('getInsights passes fixture metrics through untouched', async () => {
  const insights = require('./fixtures/insights.json');
  await withServer(
    () => ({ status: 200, body: insights }),
    async (server) => {
      const result = await runCli(['getInsights', `--accountId=${ACCOUNT}`], envFor(server));
      assert.equal(result.status, 0);
      assert.equal(result.json.count, 1);

      const [row] = result.json.insights;
      assert.equal(row.campaign_name, 'Search — Brand');
      assert.equal(row.spend, '227694');
      assert.equal(row.actions.length, 2);
      assert.equal(row.actions[1].action_type, 'messaging_conversation_started_7d');

      assert.equal(server.requests[0].path, `/v26.0/${ACCOUNT}/insights`);
      assert.equal(server.requests[0].query.level, 'campaign');
    },
  );
});

test('an empty result set is a success, not an error', async () => {
  await withServer(
    () => ({ status: 200, body: { data: [] } }),
    async (server) => {
      const result = await runCli(['getInsights', `--accountId=${ACCOUNT}`], envFor(server));
      assert.equal(result.status, 0);
      assert.equal(result.json.count, 0);
      assert.deepEqual(result.json.insights, []);
    },
  );
});

test('Meta API errors are classified, masked, and never leak the token', async () => {
  const error = require('./fixtures/error-oauth.json');
  await withServer(
    () => ({ status: 400, body: error }),
    async (server) => {
      const result = await runCli(['getInsights', `--accountId=${ACCOUNT}`], envFor(server));
      assert.equal(result.status, 1);
      assert.equal(result.json.status, 'error');
      assert.equal(result.json.meta.type, 'OAuthException');
      assert.equal(result.json.meta.code, 190);
      assert.equal(result.json.meta.subcode, 460);
      assert.equal(result.json.meta.fbtrace_id, error.error.fbtrace_id);
      assert.equal(result.json.accountId, 'act_***6789');
      assert.ok(!result.stdout.includes(TOKEN), 'token must never be printed');
      assert.ok(!result.stdout.includes(ACCOUNT), 'raw account id must not be printed on error');
    },
  );
});

test('malformed API responses are reported as parse errors', async () => {
  await withServer(
    () => ({ status: 200, raw: '<html>maintenance</html>' }),
    async (server) => {
      const result = await runCli(['getCampaigns', `--accountId=${ACCOUNT}`], envFor(server));
      assert.equal(result.status, 1);
      assert.match(result.json.error, /Could not parse Meta API response/);
    },
  );
});

test('slow responses hit the configured timeout', async () => {
  await withServer(
    () => ({ status: 200, delayMs: 500, body: server_campaigns() }),
    async (server) => {
      const result = await runCli(['getCampaigns', `--accountId=${ACCOUNT}`], envFor(server, { META_API_TIMEOUT_MS: '150' }));
      assert.equal(result.status, 1);
      assert.match(result.json.error, /timed out after 150ms/);
    },
  );
});

test('the API version can be pinned per environment', async () => {
  await withServer(
    () => ({ status: 200, body: { id: '42' } }),
    async (server) => {
      const result = await runCli(['testConnection'], envFor(server, { META_API_VERSION: 'v25.0' }));
      assert.equal(result.status, 0);
      assert.equal(result.json.apiVersion, 'v25.0');
      assert.equal(server.requests[0].path, '/v25.0/me');
    },
  );
});

test('the API version can be pinned per call', async () => {
  await withServer(
    () => ({ status: 200, body: { id: '42' } }),
    async (server) => {
      const result = await runCli(['testConnection', '--apiVersion=v24.0'], envFor(server));
      assert.equal(result.status, 0);
      assert.equal(result.json.apiVersion, 'v24.0');
      assert.equal(server.requests[0].path, '/v24.0/me');
    },
  );
});

function server_campaigns() {
  return require('./fixtures/campaigns.json');
}
