#!/usr/bin/env node
/**
 * Meta Ads Analyzer — CLI for Meta Marketing API.
 * Standalone, zero dependencies. Designed for AI agents and shell automation.
 */

'use strict';

const https = require('https');
const querystring = require('querystring');

const CONFIG = {
  accessToken: process.env.META_ACCESS_TOKEN || '',
  apiVersion: process.env.META_API_VERSION || 'v23.0',
  timeoutMs: Number.parseInt(process.env.META_API_TIMEOUT_MS || '10000', 10),
};

const COMMANDS = {
  getCampaigns: { desc: 'List all campaigns', needs: ['accountId'] },
  getInsights: { desc: 'Get campaign-level performance metrics', needs: ['accountId'] },
  testConnection: { desc: 'Test Meta API connection', needs: [] },
};

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function printHelp() {
  printJson({
    help: 'Meta Ads Analyzer CLI',
    usage: 'node meta-ads-cli.js <command> [options]',
    commands: COMMANDS,
    examples: [
      'node meta-ads-cli.js testConnection',
      'node meta-ads-cli.js getCampaigns --accountId=act_123456789',
      'node meta-ads-cli.js getInsights --accountId=act_123456789 --datePreset=last_30d',
    ],
    environment: {
      required: ['META_ACCESS_TOKEN', 'META_ACCOUNT_ID for wrapper usage'],
      optional: ['META_API_VERSION', 'META_API_TIMEOUT_MS'],
    },
  });
}

function maskAccountId(accountId) {
  if (!accountId || !accountId.startsWith('act_')) return accountId || null;
  const suffix = accountId.slice(-4);
  return `act_***${suffix}`;
}

function assertAccessToken() {
  if (!CONFIG.accessToken) {
    throw new Error('META_ACCESS_TOKEN is required. Set it in your environment; do not hardcode tokens.');
  }
}

function makeApiRequest(path, params = {}) {
  assertAccessToken();

  return new Promise((resolve, reject) => {
    const queryParams = {
      access_token: CONFIG.accessToken,
      ...params,
    };

    const query = querystring.stringify(queryParams);
    const url = `https://graph.facebook.com/${CONFIG.apiVersion}${path}?${query}`;

    const req = https.get(url, (res) => {
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
    req.setTimeout(CONFIG.timeoutMs, () => {
      req.destroy(new Error(`Meta API request timed out after ${CONFIG.timeoutMs}ms`));
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

async function testConnection() {
  try {
    const result = await makeApiRequest('/me', { fields: 'id,name' });
    return {
      status: 'success',
      connected: true,
      user: result,
      apiVersion: CONFIG.apiVersion,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return normalizeError(error, { connected: false, apiVersion: CONFIG.apiVersion });
  }
}

async function getCampaigns(accountId, datePreset = 'last_30d') {
  if (!accountId) throw new Error('accountId is required');

  try {
    const result = await makeApiRequest(`/${accountId}/campaigns`, {
      fields: 'id,name,status,objective,daily_budget,lifetime_budget,spend_cap,start_time,stop_time',
      date_preset: datePreset,
      limit: 100,
    });

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

async function getInsights(accountId, datePreset = 'last_30d') {
  if (!accountId) throw new Error('accountId is required');

  try {
    const result = await makeApiRequest(`/${accountId}/insights`, {
      fields: 'campaign_name,impressions,reach,clicks,spend,ctr,cpc,cpm,actions,action_values',
      date_preset: datePreset,
      level: 'campaign',
      limit: 100,
    });

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

async function main() {
  const args = process.argv.slice(2);

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
    const accountId = options.accountId || process.env.META_ACCOUNT_ID;
    const datePreset = options.datePreset || 'last_30d';
    let result;

    switch (command) {
      case 'testConnection':
        result = await testConnection();
        break;
      case 'getCampaigns':
        result = await getCampaigns(accountId, datePreset);
        break;
      case 'getInsights':
        result = await getInsights(accountId, datePreset);
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

main().catch((error) => {
  printJson(normalizeError(error));
  process.exitCode = 1;
});
