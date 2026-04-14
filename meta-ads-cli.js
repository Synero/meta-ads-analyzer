#!/usr/bin/env node
/**
 * Meta Ads Analyzer — CLI for Meta Marketing API
 * Standalone, zero dependencies. Works with any AI agent.
 */

const https = require('https');
const querystring = require('querystring');

// Configuración
// IMPORTANTE: Configura estas variables de entorno o reemplaza los valores
const CONFIG = {
  accessToken: process.env.META_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN_HERE',
  appSecret: process.env.META_APP_SECRET || 'YOUR_APP_SECRET_HERE',
  apiVersion: 'v23.0'
};

// Commands
const COMMANDS = {
  getCampaigns: { desc: 'List all campaigns', needs: ['accountId'] },
  getAdSets: { desc: 'List ad sets for a campaign', needs: ['campaignId'] },
  getAds: { desc: 'List ads for an ad set', needs: ['adsetId'] },
  getInsights: { desc: 'Get performance metrics', needs: ['accountId'] },
  testConnection: { desc: 'Test API connection', needs: [] }
};

function printHelp() {
  console.log(JSON.stringify({
    help: 'Meta Ads Analyzer CLI',
    usage: 'node meta-ads-cli.js <comando> [opciones]',
    commands: COMMANDS,
    examples: [
      'node meta-ads-cli.js testConnection',
      'node meta-ads-cli.js getCampaigns --accountId=act_123456',
      'node meta-ads-cli.js getInsights --accountId=act_123456 --datePreset=last_30d'
    ]
  }, null, 2));
}

function makeApiRequest(path, params = {}) {
  return new Promise((resolve, reject) => {
    const queryParams = {
      access_token: CONFIG.accessToken,
      ...params
    };
    
    const query = querystring.stringify(queryParams);
    const url = `https://graph.facebook.com/${CONFIG.apiVersion}${path}?${query}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(parsed.error.message));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject).setTimeout(10000, () => reject(new Error('timeout')));
  });
}

async function testConnection() {
  try {
    // Probar con la cuenta de negocio o el token
    const result = await makeApiRequest('/me', { fields: 'id,name' });
    return {
      status: 'success',
      connected: true,
      user: result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      connected: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function getCampaigns(accountId, datePreset = 'last_30d') {
  if (!accountId) throw new Error('accountId requerido');
  
  try {
    const result = await makeApiRequest(`/${accountId}/campaigns`, {
      fields: 'id,name,status,objective,daily_budget,lifetime_budget,spend_cap,start_time,stop_time',
      date_preset: datePreset,
      limit: 100
    });
    
    return {
      status: 'success',
      accountId,
      campaigns: result.data || [],
      count: result.data ? result.data.length : 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      accountId,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function getInsights(accountId, datePreset = 'last_30d') {
  if (!accountId) throw new Error('accountId requerido');
  
  try {
    const result = await makeApiRequest(`/${accountId}/insights`, {
      fields: 'campaign_name,impressions,reach,clicks,spend,ctr,cpc,cpm,actions,action_values',
      date_preset: datePreset,
      level: 'campaign',
      limit: 100
    });
    
    return {
      status: 'success',
      accountId,
      insights: result.data || [],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      accountId,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const command = args[0];
  const options = {};
  
  // Parsear opciones
  args.slice(1).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      options[key] = value;
    }
  });

  // Validar comando
  if (!COMMANDS[command]) {
    console.log(JSON.stringify({
      status: 'error',
      error: `Comando desconocido: ${command}`,
      available: Object.keys(COMMANDS)
    }, null, 2));
    process.exit(1);
  }

  try {
    let result;
    
    switch (command) {
      case 'testConnection':
        result = await testConnection();
        break;
      case 'getCampaigns':
        result = await getCampaigns(options.accountId, options.datePreset);
        break;
      case 'getInsights':
        result = await getInsights(options.accountId, options.datePreset);
        break;
      default:
        result = { status: 'pending', command, message: 'En desarrollo' };
    }
    
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.log(JSON.stringify({
      status: 'error',
      command,
      error: error.message,
      stack: error.stack
    }, null, 2));
    process.exit(1);
  }
}

main().catch(console.error);
