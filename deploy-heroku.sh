#!/bin/bash

# FightBot Heroku Deployment Script
# Run this script to deploy your bot to Heroku

echo "🚀 Deploying FightBot to Heroku..."

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI not found. Please install it first:"
    echo "   https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if user is logged in
if ! heroku auth:whoami &> /dev/null; then
    echo "🔐 Please login to Heroku first:"
    heroku login
fi

# Get app name
read -p "Enter your Heroku app name (or press Enter for 'fightbot-premium'): " APP_NAME
APP_NAME=${APP_NAME:-fightbot-premium}

echo "📱 Creating Heroku app: $APP_NAME"

# Create app (this will fail if it already exists, which is fine)
heroku create $APP_NAME 2>/dev/null || echo "App already exists, continuing..."

# Set app for this directory
heroku git:remote -a $APP_NAME

echo "⚙️ Setting up environment variables..."
echo "You'll need to set these manually using: heroku config:set KEY=value"
echo ""
echo "Required environment variables:"
echo "- DISCORD_TOKEN=your_production_bot_token"
echo "- CLIENT_ID=your_production_client_id" 
echo "- STRIPE_SECRET_KEY=sk_live_your_live_secret_key"
echo "- STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key"
echo "- STRIPE_PRICE_ID=price_your_live_monthly_price_id"
echo "- STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret"
echo "- WEBHOOK_URL=https://$APP_NAME.herokuapp.com/webhook/stripe"
echo "- NODE_ENV=production"
echo ""

read -p "Have you set all environment variables? (y/N): " VARS_SET
if [[ ! $VARS_SET =~ ^[Yy]$ ]]; then
    echo "Please set environment variables first, then run this script again."
    echo "Example: heroku config:set DISCORD_TOKEN=your_token"
    exit 1
fi

echo "📦 Deploying to Heroku..."
git add .
git commit -m "Deploy FightBot to Heroku" || echo "No changes to commit"
git push heroku main

echo "🤖 Deploying Discord commands globally..."
heroku run npm run deploy:global

echo "✅ Deployment complete!"
echo ""
echo "Your bot is now running at: https://$APP_NAME.herokuapp.com"
echo "Webhook endpoint: https://$APP_NAME.herokuapp.com/webhook/stripe"
echo ""
echo "Next steps:"
echo "1. Update your Stripe webhook URL to: https://$APP_NAME.herokuapp.com/webhook/stripe"
echo "2. Test your bot with /subscribe command"
echo "3. Monitor logs with: heroku logs --tail -a $APP_NAME"
