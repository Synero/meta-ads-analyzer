#!/bin/bash
# Meta Ads Analyzer — quick wrapper for AI agents
# Usage: ./meta-ads.sh <command>

SCRIPT_DIR="$(dirname "$0")"
ACCOUNT_ID="${META_ACCOUNT_ID:-act_YOUR_ACCOUNT_ID}"

case "$1" in
  campaigns|campanas|campañas)
    node "$SCRIPT_DIR/meta-ads-cli.js" getCampaigns --accountId=$ACCOUNT_ID
    ;;
  insights|metricas|métricas|rendimiento)
    node "$SCRIPT_DIR/meta-ads-cli.js" getInsights --accountId=$ACCOUNT_ID
    ;;
  test|conexion|conexión|ping)
    node "$SCRIPT_DIR/meta-ads-cli.js" testConnection
    ;;
  help|-h|--help|ayuda)
    echo "Meta Ads Analyzer"
    echo ""
    echo "Usage: ./meta-ads.sh <command>"
    echo ""
    echo "Commands:"
    echo "  campaigns    List all campaigns"
    echo "  insights     Performance metrics per campaign"
    echo "  test         Test API connection"
    echo "  help         Show this help"
    echo ""
    echo "Examples:"
    echo "  ./meta-ads.sh campaigns"
    echo "  ./meta-ads.sh insights"
    echo ""
    echo "Credentials: set META_ACCESS_TOKEN and META_ACCOUNT_ID env vars."
    ;;
  *)
    echo "Unknown command: $1"
    echo "Run: ./meta-ads.sh help"
    exit 1
    ;;
esac
