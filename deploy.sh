#!/bin/bash

# Farewell Cafe Deployment Script
# This script helps deploy the Cloudflare Worker

set -e

echo "🚀 Farewell Cafe Deployment Script"
echo "=================================="

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI is not installed. Installing..."
    npm install -g wrangler
fi

# Check if user is authenticated
if ! wrangler whoami &> /dev/null; then
    echo "❌ You need to authenticate with Cloudflare first."
    echo "Run: wrangler auth"
    exit 1
fi

echo "✅ Wrangler is installed and authenticated"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Ask user which environment to deploy to
echo ""
echo "Select deployment environment:"
echo "1) Development (preview)"
echo "2) Production (dev.farewellcafe.com)"
echo "3) Local development server"

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo "🔧 Deploying to development environment..."
        npm run deploy
        ;;
    2)
        echo "🌟 Deploying to production (dev.farewellcafe.com)..."
        npm run deploy:production
        ;;
    3)
        echo "💻 Starting local development server..."
        echo "Your site will be available at http://localhost:8787"
        npm run dev
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Useful commands:"
echo "   • View logs: npm run tail"
echo "   • Local development: npm run dev"
echo "   • Redeploy: ./deploy.sh"
