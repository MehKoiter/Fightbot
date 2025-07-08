# Heroku Deployment Checklist for FightBot

## Before You Deploy

### ✅ 1. Production Discord Bot Setup
- [ ] Created new Discord application at https://discord.com/developers/applications
- [ ] Got production bot token and client ID
- [ ] Invited bot to your production Discord server
- [ ] Noted down production Guild ID (if using guild-specific commands)

### ✅ 2. Production Stripe Setup
- [ ] Switched to live mode in Stripe dashboard
- [ ] Got live API keys (sk_live_... and pk_live_...)
- [ ] Created live product for FightBot Premium ($4.99/month)
- [ ] Got live price ID (price_...)
- [ ] Have live webhook secret ready (you'll create this after deployment)

### ✅ 3. Code Preparation
- [ ] All code committed to git
- [ ] Tested bot locally
- [ ] Reviewed all environment variables needed

## Deployment Steps

### 🚀 1. Install Heroku CLI
Download from: https://devcenter.heroku.com/articles/heroku-cli

### 🚀 2. Run Deployment Script
```bash
# On Windows
./deploy-heroku.bat

# On Mac/Linux
chmod +x deploy-heroku.sh
./deploy-heroku.sh
```

Or deploy manually:

```bash
# Login to Heroku
heroku login

# Create app
heroku create fightbot-premium

# Set environment variables
heroku config:set DISCORD_TOKEN=your_production_token
heroku config:set CLIENT_ID=your_production_client_id
heroku config:set GUILD_ID=your_production_guild_id
heroku config:set STRIPE_SECRET_KEY=sk_live_your_live_key
heroku config:set STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
heroku config:set STRIPE_PRICE_ID=price_your_live_price
heroku config:set NODE_ENV=production
heroku config:set WEBHOOK_URL=https://your-app.herokuapp.com/webhook/stripe

# Deploy
git push heroku main

# Deploy commands globally
heroku run npm run deploy:global
```

### 🚀 3. Post-Deployment Setup

#### Set Up Stripe Webhook
1. Go to Stripe Dashboard → Webhooks
2. Create new webhook endpoint
3. URL: `https://your-app.herokuapp.com/webhook/stripe`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy webhook secret
6. Set in Heroku: `heroku config:set STRIPE_WEBHOOK_SECRET=whsec_your_secret`

#### Test Everything
- [ ] Bot shows online in Discord
- [ ] Test `/subscribe` command
- [ ] Complete a test payment (you can cancel subscription immediately)
- [ ] Verify webhook receives events
- [ ] Test `/account` command

## Monitoring

### 📊 Check App Status
```bash
heroku ps -a your-app-name
```

### 📊 View Logs
```bash
heroku logs --tail -a your-app-name
```

### 📊 Health Check
Visit: `https://your-app.herokuapp.com/health`

## Environment Variables Reference

Required variables for production:
```
DISCORD_TOKEN=your_production_bot_token
CLIENT_ID=your_production_client_id
GUILD_ID=your_production_guild_id (optional)
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_PRICE_ID=price_your_live_monthly_price_id
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
WEBHOOK_URL=https://your-app.herokuapp.com/webhook/stripe
NODE_ENV=production
```

## Troubleshooting

### 🔧 Bot Not Starting
```bash
heroku logs --tail
```
Check for missing environment variables.

### 🔧 Payments Not Working
1. Verify all Stripe keys are live keys (not test)
2. Check webhook URL is correct
3. Verify webhook secret matches

### 🔧 Commands Not Available
```bash
heroku run npm run deploy:global
```

### 🔧 Database Resets
Heroku's filesystem is ephemeral. Consider upgrading to PostgreSQL:
```bash
heroku addons:create heroku-postgresql:mini
```

## Success! 🎉

Your FightBot is now running in production! 

- **Bot URL**: https://your-app.herokuapp.com
- **Webhook**: https://your-app.herokuapp.com/webhook/stripe
- **Health**: https://your-app.herokuapp.com/health

Users can now subscribe with `/subscribe` and manage subscriptions with `/account`!
