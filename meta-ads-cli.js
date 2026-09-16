#!/usr/bin/env node
/**
 * Meta Ads Analyzer — CLI for Meta Marketing API.
 * Standalone, zero dependencies. Designed for AI agents and shell automation.
 */

'use strict';

const https = require('https');
const http = require('http');

const DEFAULT_API_VERSION = 'v26.0';
const DEFAULT_BASE_URL = 'https://graph.facebook.com';
const DEFAULT_TIMEOUT_MS = 10000;

const COMMANDS = {
  getCampaigns: { desc: 'List all campaigns', needs: ['accountId'] },
  getInsights: { desc: 'Get campaign-level performance metrics', needs: ['accountId'] },
  testConnection: { desc: 'Test Meta API connection', needs: [] },
};

/**
 * Resolved at call time, not at load time, so tests and long-running agents can
 * change environment variables between requests.
 */
function getConfig(overrides = {}) {
  const env = process.env;
  const parsedTimeout = Number.parseInt(env.META_API_TIMEOUT_MS || String(DEFAULT_TIMEOUT_MS), 10);

  const config = {
    accessToken: env.META_ACCESS_TOKEN || '',
    accountId: env.META_ACCOUNT_ID || '',
    apiVersion: env.META_API_VERSION || DEFAULT_API_VERSION,
    baseUrl: env.META_API_BASE_URL || DEFAULT_BASE_URL,
    timeoutMs: Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : DEFAULT_TIMEOUT_MS,
  };

  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined && value !== null && value !== '') config[key] = value;
  }

  return config;
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function printHelp() {
  printJson({
    help: 'Meta Ads Analyzer CLI',
    usage: 'node meta-ads-cli.js <command> [options]',
    commands: COMMANDS,
    options: {
      '--accountId': 'Meta ad account id (falls back to META_ACCOUNT_ID)',
      '--datePreset': 'Meta date preset, e.g. last_7d, last_30d (default: last_30d)',
      '--apiVersion': 'Override the Graph API version for this call, e.g. v25.0',
    },
    examples: [
      'node meta-ads-cli.js testConnection',
      'node meta-ads-cli.js getCampaigns --accountId=act_123456789',
      'node meta-ads-cli.js getInsights --accountId=act_123456789 --datePreset=last_30d',
    ],
    environment: {
      required: ['META_ACCESS_TOKEN', 'META_ACCOUNT_ID for wrapper usage'],
      optional: ['META_API_VERSION', 'META_API_BASE_URL', 'META_API_TIMEOUT_MS'],
      defaults: { apiVersion: DEFAULT_API_VERSION, baseUrl: DEFAULT_BASE_URL, timeoutMs: DEFAULT_TIMEOUT_MS },
    },
  });
}

function maskAccountId(accountId) {
  if (!accountId || !accountId.startsWith('act_')) return accountId || null;
  const suffix = accountId.slice(-4);
  return `act_***${suffix}`;
}

function assertAccessToken(config) {
  if (!config.accessToken) {
    throw new Error('META_ACCESS_TOKEN is required. Set it in your environment; do not hardcode tokens.');
  }
}

/**
 * Builds the versioned Graph API URL. Kept separate from the request itself so the
 * URL contract can be asserted without touching the network.
 */
function buildUrl(path, params = {}, config = getConfig()) {
  const base = new URL(config.baseUrl);
  const basePath = base.pathname.replace(/\/+$/, '');
  const url = new URL(`${basePath}/${config.apiVersion}${path}`, base.origin);

  const queryParams = { access_token: config.accessToken, ...params };
  for (const [key, value] of Object.entries(queryParams)) {
    if (value === undefined || value === null) continue;
    url.searchParams.set(key, String(value));
  }

  return url;
}

function makeApiRequest(path, params = {}, config = getConfig()) {
  assertAccessToken(config);

  const url = buildUrl(path, params, config);
  const transport = url.protocol === 'http:' ? http : https;

  return new Promise((resolve, reject) => {
    const req = transport.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data || '{}');
          if (parsed.error) {
            const err = new Error(parsed.error.message || 'Meta API error');
            err.meta = {
              type: parsed.error.type,
              code: parsed.error.code,
              subcode: parsed.error.error_subcode,
              fbtrace_id: parsed.error.fbtrace_id,
              statusCode: res.statusCode,
            };
            reject(err);
            return;
          }
          resolve(parsed);
        } catch (error) {
          reject(new Error(`Could not parse Meta API response: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(config.timeoutMs, () => {
      req.destroy(new Error(`Meta API request timed out after ${config.timeoutMs}ms`));
    });
  });
}

function normalizeError(error, extra = {}) {
  return {
    status: 'error',
    error: error.message,
    meta: error.meta || undefined,
    ...extra,
    timestamp: new Date().toISOString(),
  };
}

async function testConnection(config = getConfig()) {
  try {
    const result = await makeApiRequest('/me', { fields: 'id,name' }, config);
    return {
      status: 'success',
      connected: true,
      user: result,
      apiVersion: config.apiVersion,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return normalizeError(error, { connected: false, apiVersion: config.apiVersion });
  }
}

async function getCampaigns(accountId, datePreset = 'last_30d', config = getConfig()) {
  if (!accountId) throw new Error('accountId is required');

  try {
    const result = await makeApiRequest(
      `/${accountId}/campaigns`,
      {
        fields: 'id,name,status,objective,daily_budget,lifetime_budget,spend_cap,start_time,stop_time',
        date_preset: datePreset,
        limit: 100,
      },
      config,
    );

    return {
      status: 'success',
      accountId,
      campaigns: result.data || [],
      count: Array.isArray(result.data) ? result.data.length : 0,
      datePreset,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return normalizeError(error, { accountId: maskAccountId(accountId), datePreset });
  }
}

async function getInsights(accountId, datePreset = 'last_30d', config = getConfig()) {
  if (!accountId) throw new Error('accountId is required');

  try {
    const result = await makeApiRequest(
      `/${accountId}/insights`,
      {
        fields: 'campaign_name,impressions,reach,clicks,spend,ctr,cpc,cpm,actions,action_values',
        date_preset: datePreset,
        level: 'campaign',
        limit: 100,
      },
      config,
    );

    return {
      status: 'success',
      accountId,
      insights: result.data || [],
      count: Array.isArray(result.data) ? result.data.length : 0,
      datePreset,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return normalizeError(error, { accountId: maskAccountId(accountId), datePreset });
  }
}

function parseArgs(args) {
  const options = {};
  for (const arg of args) {
    if (!arg.startsWith('--')) continue;
    const raw = arg.slice(2);
    const index = raw.indexOf('=');
    if (index === -1) {
      options[raw] = true;
    } else {
      options[raw.slice(0, index)] = raw.slice(index + 1);
    }
  }
  return options;
}

async function main(argv = process.argv.slice(2)) {
  const args = argv;

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  const command = args[0];
  const options = parseArgs(args.slice(1));

  if (!COMMANDS[command]) {
    printJson({
      status: 'error',
      error: `Unknown command: ${command}`,
      available: Object.keys(COMMANDS),
    });
    process.exitCode = 1;
    return;
  }

  try {
    const config = getConfig(options.apiVersion ? { apiVersion: options.apiVersion } : {});
    const accountId = options.accountId || config.accountId;
    const datePreset = options.datePreset || 'last_30d';
    let result;

    switch (command) {
      case 'testConnection':
        result = await testConnection(config);
        break;
      case 'getCampaigns':
        result = await getCampaigns(accountId, datePreset, config);
        break;
      case 'getInsights':
        result = await getInsights(accountId, datePreset, config);
        break;
      default:
        throw new Error(`Unhandled command: ${command}`);
    }

    printJson(result);
    if (result.status === 'error') process.exitCode = 1;
  } catch (error) {
    printJson(normalizeError(error, { command }));
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((error) => {
    printJson(normalizeError(error));
    process.exitCode = 1;
  });
}

module.exports = {
  DEFAULT_API_VERSION,
  DEFAULT_BASE_URL,
  DEFAULT_TIMEOUT_MS,
  COMMANDS,
  getConfig,
  buildUrl,
  makeApiRequest,
  normalizeError,
  maskAccountId,
  testConnection,
  getCampaigns,
  getInsights,
  parseArgs,
  main,
};
