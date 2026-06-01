#!/usr/bin/env bash
# Setup script for Meta Ads Analyzer.

set -euo pipefail

echo "Meta Ads Analyzer — setup"
echo "========================="
echo

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. Install Node.js 18+ first." >&2
  exit 1
fi

NODE_MAJOR="$(node -p "Number(process.versions.node.split('.')[0])")"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Node.js 18+ is required. Current version: $(node --version)" >&2
  exit 1
fi

echo "Node.js: $(node --version)"

chmod +x meta-ads-cli.js meta-ads.sh

echo
if [ -z "${META_ACCESS_TOKEN:-}" ]; then
  echo "META_ACCESS_TOKEN is not set."
  echo "Set it with: export META_ACCESS_TOKEN='your_token'"
else
  echo "META_ACCESS_TOKEN is set."
fi

if [ -z "${META_ACCOUNT_ID:-}" ]; then
  echo "META_ACCOUNT_ID is not set."
  echo "Set it with: export META_ACCOUNT_ID='act_123456789'"
else
  echo "META_ACCOUNT_ID is set."
fi

echo
node --check meta-ads-cli.js
bash -n meta-ads.sh
echo "Syntax checks passed."

echo
if [ -n "${META_ACCESS_TOKEN:-}" ]; then
  echo "Testing Meta API connection..."
  ./meta-ads.sh test || true
else
  echo "Skipping API test because META_ACCESS_TOKEN is not set."
fi

echo
echo "Quick start:"
echo "  ./meta-ads.sh campaigns"
echo "  ./meta-ads.sh insights"
echo "  ./meta-ads.sh test"
