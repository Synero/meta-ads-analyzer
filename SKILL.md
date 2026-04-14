---
name: meta-ads-analyzer
description: "Analyze Facebook/Instagram Ads campaigns via Meta Marketing API. Get campaign data, performance metrics, and insights directly from your ad account."
tags: [meta, ads, facebook, instagram, analytics, marketing]
related_skills: []
---

# Meta Ads Analyzer

Analyze your Facebook/Instagram Ads campaigns in real-time. No CSV exports, no dashboard switching — just ask your agent.

## Install

Point your agent to this repo: https://github.com/Synero/meta-ads-openclaw

Your agent reads this SKILL.md, sets up credentials, and follows the instructions below. Works with Hermes, OpenClaw, Claude Code, Cursor, or any agent that supports skills/instructions.

## Setup

```bash
# Clone
git clone https://github.com/Synero/meta-ads-openclaw.git
cd meta-ads-openclaw

# Configure credentials
export META_ACCESS_TOKEN="your_token_here"
export META_ACCOUNT_ID="act_123456789"

# Test connection
bash meta-ads.sh test
```

**Getting your token:**
1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer)
2. Select your Meta app
3. Generate token with permissions: `ads_read`, `ads_management`
4. Copy the token

## Commands

```bash
bash meta-ads.sh campaigns    # List all campaigns
bash meta-ads.sh insights     # Performance metrics per campaign
bash meta-ads.sh test         # Verify API connection
```

All commands return JSON.

## How to Use

The user asks about their ads in natural language. Extract intent and run the right command.

| User says | Command | What to look for |
|-----------|---------|-----------------|
| "How are my campaigns?" | `insights` | Spend, CTR, top performers |
| "Which campaign is best?" | `insights` | Compare CPC, CTR, conversions |
| "What's active?" | `campaigns` | Filter by status=ACTIVE |
| "Am I spending too much?" | `insights` | Total spend, CPC trends |
| "How many leads?" | `insights` | Actions → lead count |

## Metrics Reference

| Metric | Field | Healthy range |
|--------|-------|---------------|
| Spend | `spend` | Depends on budget |
| Impressions | `impressions` | — |
| Reach | `reach` | — |
| Clicks | `clicks` | — |
| CTR | `ctr` | >2% good, <1% review creative |
| CPC | `cpc` | Lower = better |
| CPM | `cpm` | Industry-dependent |
| Conversations | `messaging_conversation_started_7d` | — |
| Leads | `lead` (in actions) | — |

## Analysis Guidelines

### CTR
- 1-2%: Industry average
- \>2%: Good performance
- <1%: Creative or targeting needs work

### Frequency
```
Frequency = Impressions / Reach
```
- 1-2: Optimal
- 2-3: Monitor
- \>3: Ad fatigue risk — rotate creatives

### CPC Comparison
Compare CPC across campaigns to identify most efficient spend. Lower CPC = better cost efficiency.

### Breakdown Effect
Don't pause ad sets based solely on high CPA — the system optimizes across the whole set. Evaluate marginal vs average performance.

## Output Format

```json
{
  "status": "success",
  "accountId": "act_123456789",
  "campaigns": [
    {
      "name": "Campaign_Name",
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
    }
  ]
}
```

## Limitations

- Read-only — cannot modify campaigns
- 1-2 hour data delay (Meta API)
- Token expires ~every 60 days
- Meta API rate limits apply

## Troubleshooting

**"Invalid token"** — Token expired. Generate a new one at Graph API Explorer.

**"Permission denied"** — App missing `ads_read` or `ads_management` permissions. Check app settings.

**"Account not found"** — Wrong Account ID. Format: `act_XXXXXXXXX`.

## Project Files

- `meta-ads.sh` — Shell wrapper (campaigns, insights, test)
- `meta-ads-cli.js` — Node.js CLI that calls Meta Graph API
- `setup.sh` — One-time setup script

## API Notes

- Meta Graph API v23.0
- No dependencies beyond Node.js 18+
- Free — uses your own Meta app credentials
