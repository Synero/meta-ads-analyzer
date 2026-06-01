---
name: meta-ads-analyzer
description: "Analyze Facebook/Instagram Ads campaigns via the Meta Marketing API from any AI agent or shell automation."
tags: [meta, ads, facebook, instagram, analytics, marketing, agents]
related_skills: []
---

# Meta Ads Analyzer

Use this skill when a user asks an AI agent to inspect Facebook/Instagram Ads campaign performance, active campaigns, spend, CTR, CPC, CPM, leads, or messaging conversations.

The project is read-only. It does not create, edit, pause, or delete campaigns.

## Setup

```bash
git clone https://github.com/Synero/meta-ads-analyzer.git
cd meta-ads-analyzer

export META_ACCESS_TOKEN="your_meta_access_token"
export META_ACCOUNT_ID="act_123456789"

bash setup.sh
```

Required Meta permissions usually include:

- `ads_read`
- `ads_management` if the user's Meta app/account flow requires it

## Commands

```bash
./meta-ads.sh test
./meta-ads.sh campaigns
./meta-ads.sh insights
./meta-ads.sh insights --datePreset=last_7d
```

All commands return JSON.

## Intent mapping

| User intent | Command | Analysis focus |
|---|---|---|
| “How are my campaigns doing?” | `./meta-ads.sh insights` | Spend, CTR, CPC, CPM, conversions |
| “Which campaigns are active?” | `./meta-ads.sh campaigns` | `status === ACTIVE` |
| “Which campaign is cheapest?” | `./meta-ads.sh insights` | Compare CPC/CPM against objective |
| “How many leads/conversations?” | `./meta-ads.sh insights` | Inspect `actions` array |
| “Is my API connected?” | `./meta-ads.sh test` | Token and account connectivity |

## Output handling

When summarizing results:

1. State the date preset used.
2. Compare campaigns by objective-relevant metrics.
3. Mention Meta's reporting delay.
4. Do not expose raw access tokens or private account IDs in logs.
5. If the CLI returns `status: error`, report the error and suggest the smallest fix.

## Metrics reference

- `spend`: amount spent in the selected period.
- `impressions`: total ad impressions.
- `reach`: unique accounts reached.
- `clicks`: click/interactions count from Meta.
- `ctr`: click-through rate.
- `cpc`: cost per click.
- `cpm`: cost per thousand impressions.
- `actions`: conversion events such as leads or messaging conversations.

Basic heuristics:

- CTR below 1%: review creative, audience, or offer.
- CTR above 2%: usually healthy, depending on vertical.
- Frequency above 3: watch for fatigue if available.
- CPC/CPM must be interpreted relative to objective and market.

## Troubleshooting

- `META_ACCESS_TOKEN is required`: set the token in the environment.
- `Permission denied`: the app/token probably lacks ads permissions or account access.
- `Account not found`: check that `META_ACCOUNT_ID` starts with `act_` and belongs to the token's accessible accounts.
- Empty insights: check date preset, campaign delivery, attribution windows, and Meta reporting delays.

## Files

- `meta-ads.sh`: shell wrapper for agents.
- `meta-ads-cli.js`: zero-dependency Node.js CLI.
- `setup.sh`: local setup and syntax checks.
- `.env.example`: credential template.
