# Meta Ads Analyzer

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Meta Marketing API](https://img.shields.io/badge/Meta%20Marketing%20API-v23.0-0668E1)
![License](https://img.shields.io/badge/license-MIT-green)
![Zero dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen)

**Meta Ads Analyzer** is a lightweight, read-only CLI and agent skill for analyzing Facebook and Instagram Ads performance directly from the Meta Marketing API.

It is built for AI-agent workflows: Hermes, OpenClaw, Claude Code, Cursor, Codex, shell-based automations, or any maintainer workflow that can run a command and parse JSON.

No MCP server. No dashboard scraping. No npm dependencies.

## Why this exists

Marketing automation agents often need campaign facts before they can reason well:

- Which campaigns are active?
- Where is spend going?
- Which campaign has the best CTR, CPC, CPM, or lead volume?
- Did a campaign stop delivering?
- Is the account connected correctly?

Most agent integrations either require a heavier MCP setup or manual exports. This repo keeps the integration small enough to audit and easy enough to run from any automation environment.

## Features

- Read-only Meta Ads access.
- JSON output designed for AI agents and scripts.
- Campaign listing.
- Campaign-level insights: spend, impressions, reach, clicks, CTR, CPC, CPM, actions, and action values.
- Environment-variable based credentials.
- Shell wrapper with English and Spanish command aliases.
- Zero runtime dependencies beyond Node.js 18+.

## Quick start

```bash
git clone https://github.com/Synero/meta-ads-analyzer.git
cd meta-ads-analyzer
bash setup.sh
```

Set credentials:

```bash
export META_ACCESS_TOKEN="your_meta_access_token"
export META_ACCOUNT_ID="act_123456789"
```

Test the connection:

```bash
./meta-ads.sh test
```

List campaigns:

```bash
./meta-ads.sh campaigns
```

Get performance insights:

```bash
./meta-ads.sh insights
```

## Commands

| Command | Alias examples | Output |
|---|---|---|
| `./meta-ads.sh test` | `conexion`, `conexión`, `ping` | Validates token/API connectivity |
| `./meta-ads.sh campaigns` | `campanas`, `campañas` | Lists campaigns with status and budget fields |
| `./meta-ads.sh insights` | `metricas`, `métricas`, `rendimiento` | Returns campaign-level performance metrics |

Direct Node CLI usage:

```bash
node meta-ads-cli.js testConnection
node meta-ads-cli.js getCampaigns --accountId=act_123456789
node meta-ads-cli.js getInsights --accountId=act_123456789 --datePreset=last_30d
```

## Example output

```json
{
  "status": "success",
  "accountId": "act_123456789",
  "insights": [
    {
      "campaign_name": "Summer Sale 2026",
      "impressions": "226004",
      "reach": "78024",
      "clicks": "4282",
      "spend": "227694",
      "ctr": "1.89",
      "cpc": "53.17",
      "cpm": "1007.47",
      "actions": [
        {
          "action_type": "messaging_conversation_started_7d",
          "value": "333"
        }
      ]
    }
  ],
  "timestamp": "2026-06-01T00:00:00.000Z"
}
```

## Agent usage

An agent should:

1. Run `./meta-ads.sh test` if credentials are uncertain.
2. Run `./meta-ads.sh insights` for performance questions.
3. Parse JSON output.
4. Compare metrics across campaigns.
5. Report findings in plain language, including uncertainty and Meta API data-delay caveats.

Example prompts:

- “How are my active campaigns performing?”
- “Which campaign has the lowest CPC?”
- “Where is spend concentrated?”
- “Which campaigns need creative review?”
- “Summarize Meta Ads performance for today’s client report.”

## Metrics reference

| Metric | Meaning |
|---|---|
| `spend` | Amount spent in the selected date range |
| `impressions` | Times ads were shown |
| `reach` | Unique accounts reached |
| `clicks` | Total clicks/interactions reported by Meta |
| `ctr` | Click-through rate |
| `cpc` | Cost per click |
| `cpm` | Cost per thousand impressions |
| `actions` | Conversions/events reported by Meta, such as leads or messaging conversations |

Basic interpretation rules:

- CTR below 1%: review creative, audience, or offer.
- CTR above 2%: usually a healthy signal, depending on vertical.
- Frequency above 3: watch for creative fatigue.
- CPC and CPM are only meaningful relative to goal, audience, placement, and market.

## Configuration

Required:

```bash
META_ACCESS_TOKEN=your_meta_access_token
META_ACCOUNT_ID=act_123456789
```

Optional:

```bash
META_API_VERSION=v23.0
```

Copy `.env.example` if you want a local template:

```bash
cp .env.example .env
```

Do not commit `.env` files.

## Required Meta permissions

At minimum, the token must be able to read ads data for the selected ad account.

Common permissions:

- `ads_read`
- `ads_management` if your Meta app flow requires it for account access

The tool is read-only and does not create, update, pause, or delete campaigns.

## Safety and privacy

- Access tokens are read from environment variables.
- Tokens are never intentionally printed.
- The CLI returns Meta API data as JSON; downstream agents should avoid sharing sensitive account or campaign data in public logs.
- This project does not store credentials.

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## Development

```bash
npm test
```

The test script performs syntax checks for the Node and shell entrypoints without calling Meta APIs.

## Roadmap

See [ROADMAP.md](ROADMAP.md).

## Contributing

Contributions are welcome. Good first issues include:

- safer JSON normalization for actions;
- more date presets;
- account summaries;
- optional CSV export;
- better error classification for Meta API responses;
- examples for different AI-agent frameworks.

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Limitations

- Requires a valid Meta access token.
- Meta data can lag by 1–2 hours.
- Token expiration depends on your Meta app/token flow.
- Metrics depend on Meta attribution and reporting windows.
- Current scope is account/campaign-level analysis, not campaign mutation.

## License

MIT. See [LICENSE](LICENSE).

## Credits

Inspired by [mathiaschu/meta-ads-analyzer-claude](https://github.com/mathiaschu/meta-ads-analyzer-claude). This repository removes the MCP dependency and keeps a standalone, agent-agnostic CLI/skill interface.
