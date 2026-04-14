#!/bin/bash
# Setup script for Meta Ads OpenClaw

echo "Meta Ads Analyzer — Setup"
echo "========================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js version: $NODE_VERSION"

# Make scripts executable
echo ""
echo "Making scripts executable..."
chmod +x meta-ads-cli.js
chmod +x meta-ads.sh
echo "✅ Done"

# Check for tokens
echo ""
echo "Checking configuration..."

if [ -z "$META_ACCESS_TOKEN" ]; then
    echo "⚠️  META_ACCESS_TOKEN not set"
    echo "   Please set it with: export META_ACCESS_TOKEN='your_token'"
else
    echo "✅ META_ACCESS_TOKEN is set"
fi

if [ -z "$META_APP_SECRET" ]; then
    echo "⚠️  META_APP_SECRET not set"
    echo "   Please set it with: export META_APP_SECRET='your_secret'"
else
    echo "✅ META_APP_SECRET is set"
fi

if [ -z "$META_ACCOUNT_ID" ]; then
    echo "⚠️  META_ACCOUNT_ID not set"
    echo "   Please set it with: export META_ACCOUNT_ID='act_123456789'"
else
    echo "✅ META_ACCOUNT_ID is set"
fi

echo ""
echo "Testing connection..."
node meta-ads-cli.js testConnection

echo ""
echo "========================="
echo "Setup complete! 🎉"
echo ""
echo "Quick start:"
echo "  ./meta-ads.sh campaigns    # List campaigns"
echo "  ./meta-ads.sh insights     # Get performance metrics"
echo "  ./meta-ads.sh test         # Test connection"
