#!/usr/bin/env bash
# Meta Ads Analyzer — quick wrapper for AI agents.
# Usage: ./meta-ads.sh <command> [--datePreset=last_30d]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACCOUNT_ID="${META_ACCOUNT_ID:-}"

run_node() {
  node "$SCRIPT_DIR/meta-ads-cli.js" "$@"
}

case "${1:-help}" in
  campaigns|campanas|campañas)
    shift || true
    run_node getCampaigns --accountId="$ACCOUNT_ID" "$@"
    ;;
  insights|metricas|métricas|rendimiento)
    shift || true
    run_node getInsights --accountId="$ACCOUNT_ID" "$@"
    ;;
  test|conexion|conexión|ping)
    shift || true
    run_node testConnection "$@"
    ;;
  help|-h|--help|ayuda)
    cat <<'EOF'
Meta Ads Analyzer

Usage:
  ./meta-ads.sh <command> [options]

Commands:
  campaigns    List campaigns
  insights     Campaign-level performance metrics
  test         Test Meta API connection
  help         Show this help

Examples:
  ./meta-ads.sh campaigns
  ./meta-ads.sh insights
  ./meta-ads.sh insights --datePreset=last_7d

Credentials:
  export META_ACCESS_TOKEN="your_meta_access_token"
  export META_ACCOUNT_ID="act_123456789"
EOF
    ;;
  *)
    echo "Unknown command: $1" >&2
    echo "Run: ./meta-ads.sh help" >&2
    exit 1
    ;;
esac
