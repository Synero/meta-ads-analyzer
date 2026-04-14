# Meta Ads Analyzer

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Meta API](https://img.shields.io/badge/Meta-API-0668E1)
![License](https://img.shields.io/badge/license-MIT-green)

Analyze your Facebook/Instagram Ads campaigns from any AI agent. Reads Meta Marketing API directly — no MCP, no plugins, zero dependencies beyond Node.js.

## Install

Point your AI agent to this repo: **https://github.com/Synero/meta-ads-analyzer**

Works with **Hermes**, **OpenClaw**, **Claude Code**, **Cursor**, or any agent that supports skills/instructions. Your agent reads SKILL.md and follows the instructions below.

Manual setup:
```bash
git clone https://github.com/Synero/meta-ads-openclaw.git
cd meta-ads-openclaw
bash setup.sh
```

## What It Does

| Command | Output |
|---------|--------|
| `meta-ads.sh campaigns` | List all campaigns with status and budget |
| `meta-ads.sh insights` | Performance metrics per campaign (spend, CTR, CPC, conversions) |
| `meta-ads.sh test` | Verify API connection |

## Example Output

```json
{
  "campaigns": [{
    "name": "Summer_Sale_2026",
    "status": "ACTIVE",
    "daily_budget": "16000",
    "insights": {
      "impressions": 226004,
      "reach": 78024,
      "clicks": 4282,
      "ctr": "1.89%",
      "cpc": "53.17",
      "spend": "227694",
      "messaging_conversation_started_7d": 333
    }
  }]
}
```

## Metrics

| Metric | What it means |
|--------|---------------|
| **Spend** | Total amount spent |
| **Impressions** | Times the ad was shown |
| **Reach** | Unique accounts reached |
| **Clicks** | Total interactions |
| **CTR** | Click-through rate |
| **CPC** | Cost per click |
| **CPM** | Cost per 1000 impressions |
| **messaging_conversation_started_7d** | Conversations started via Messenger/Instagram |
| **lead** | Leads generated |

## Setup

### 1. Get your Meta credentials

- **Access Token**: Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer), select your app, generate token with `ads_read` + `ads_management` permissions
- **Account ID**: From Meta Ads Manager (format: `act_XXXXXXXXX`)

### 2. Configure

```bash
# Option A: Environment variables (recommended)
export META_ACCESS_TOKEN="your_token_here"
export META_ACCOUNT_ID="act_123456789"

# Option B: Edit meta-ads-cli.js directly (lines 12-16)
```

### 3. Test

```bash
bash meta-ads.sh test
```

### 4. Use

```bash
bash meta-ads.sh campaigns
bash meta-ads.sh insights
```

## For Your Agent

Your agent should:
1. Run `bash meta-ads.sh insights` to get current campaign data
2. Parse the JSON output
3. Analyze metrics (compare CTR, CPC, spend across campaigns)
4. Report findings in natural language

### Example Agent Interactions

**User:** "How are my campaigns doing?"
→ Agent runs `meta-ads.sh insights`, summarizes spend, CTR, top performers.

**User:** "Which campaign has the best CPC?"
→ Agent runs `meta-ads.sh insights`, compares CPC across campaigns, identifies winner.

**User:** "What campaigns are active right now?"
→ Agent runs `meta-ads.sh campaigns`, filters for ACTIVE status.

## Analysis Framework

### CTR Benchmarks
- 1-2%: Industry average
- \>2%: Good
- <1%: Review creative/targeting

### Frequency Check
- Frequency = Impressions / Reach
- 1-2: Optimal
- 2-3: Watch
- \>3: Fatigue risk

## Requirements

- Node.js 18+
- Meta Ads account
- Valid access token (expires ~every 60 days)

## Limitations

- Read-only (doesn't modify campaigns)
- 1-2 hour data delay (Meta API limitation)
- Token expires ~60 days

## License

MIT

## Credits

Based on [mathiaschu/meta-ads-analyzer-claude](https://github.com/mathiaschu/meta-ads-analyzer-claude) by [@mathiaschu](https://github.com/mathiaschu). Removed MCP dependency for standalone use with any AI agent.
