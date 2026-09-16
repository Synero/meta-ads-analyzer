'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const cli = require('../meta-ads-cli.js');

test('DEFAULT_API_VERSION tracks the current Graph API release', () => {
  assert.equal(cli.DEFAULT_API_VERSION, 'v26.0');
});

test('maskAccountId keeps only the last four digits of an ad account', () => {
  assert.equal(cli.maskAccountId('act_123456789'), 'act_***6789');
  assert.equal(cli.maskAccountId('123456789'), '123456789');
  assert.equal(cli.maskAccountId(''), null);
  assert.equal(cli.maskAccountId(undefined), null);
});

test('normalizeError returns a stable error envelope', () => {
  const plain = cli.normalizeError(new Error('boom'));
  assert.equal(plain.status, 'error');
  assert.equal(plain.error, 'boom');
  assert.equal(plain.meta, undefined);
  assert.ok(!Number.isNaN(Date.parse(plain.timestamp)));

  const withMeta = new Error('rate limited');
  withMeta.meta = { code: 17, fbtrace_id: 'abc' };
  const envelope = cli.normalizeError(withMeta, { accountId: 'act_***6789' });
  assert.equal(envelope.meta.code, 17);
  assert.equal(envelope.accountId, 'act_***6789');
});

test('parseArgs handles --key=value and bare flags', () => {
  const options = cli.parseArgs(['campaigns', '--datePreset=last_7d', '--verbose']);
  assert.deepEqual(options, { datePreset: 'last_7d', verbose: true });
});

test('getConfig reads the environment at call time, not at load time', () => {
  const previous = process.env.META_API_VERSION;
  try {
    process.env.META_API_VERSION = 'v25.0';
    assert.equal(cli.getConfig().apiVersion, 'v25.0');
    delete process.env.META_API_VERSION;
    assert.equal(cli.getConfig().apiVersion, cli.DEFAULT_API_VERSION);
  } finally {
    if (previous === undefined) delete process.env.META_API_VERSION;
    else process.env.META_API_VERSION = previous;
  }
});

test('getConfig ignores empty overrides and falls back to a sane timeout', () => {
  const config = cli.getConfig({ apiVersion: 'v24.0', baseUrl: undefined, accessToken: '' });
  assert.equal(config.apiVersion, 'v24.0');
  assert.equal(config.baseUrl, cli.DEFAULT_BASE_URL);
  assert.equal(config.accessToken, process.env.META_ACCESS_TOKEN || '');

  const invalid = cli.getConfig();
  process.env.META_API_TIMEOUT_MS = 'not-a-number';
  assert.equal(cli.getConfig().timeoutMs, cli.DEFAULT_TIMEOUT_MS);
  process.env.META_API_TIMEOUT_MS = '-5';
  assert.equal(cli.getConfig().timeoutMs, cli.DEFAULT_TIMEOUT_MS);
  delete process.env.META_API_TIMEOUT_MS;
  assert.equal(invalid.timeoutMs, cli.DEFAULT_TIMEOUT_MS);
});

test('buildUrl versions the path, appends the token, and drops empty params', () => {
  const url = cli.buildUrl(
    '/act_1/campaigns',
    { limit: 100, date_preset: undefined, cursor: null },
    { accessToken: 'tok', apiVersion: 'v26.0', baseUrl: 'https://graph.facebook.com' },
  );

  assert.equal(url.pathname, '/v26.0/act_1/campaigns');
  assert.equal(url.searchParams.get('access_token'), 'tok');
  assert.equal(url.searchParams.get('limit'), '100');
  assert.equal(url.searchParams.has('date_preset'), false);
  assert.equal(url.searchParams.has('cursor'), false);
});

test('buildUrl honours a custom base url for local and proxied runs', () => {
  const url = cli.buildUrl('/me', { fields: 'id,name' }, { accessToken: 'tok', apiVersion: 'v23.0', baseUrl: 'http://127.0.0.1:8080/' });
  assert.equal(url.origin, 'http://127.0.0.1:8080');
  assert.equal(url.pathname, '/v23.0/me');
});
