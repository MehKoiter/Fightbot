# FightBot Heroku Deployment Guide (FREE Version)

## Prerequisites

1. **Heroku Account**: Sign up at https://heroku.com
2. **Heroku CLI**: Download from https://devcenter.heroku.com/articles/heroku-cli
3. **Git**: Make sure your project is in a Git repository
4. **Discord Bot**: Bot token and application ID from Discord Developer Portal

## Pre-Deployment Checklist

### ✅ Discord Bot Setup
- [ ] Created Discord application at https://discord.com/developers/applications
- [ ] Got production bot token and client ID
- [ ] Invited bot to your production Discord server with proper permissions
- [ ] Noted down Guild ID (optional, for guild-specific commands)

### ✅ Code Preparation
- [ ] All code committed to git
- [ ] Tested bot locally with `npm start`
- [ ] Verified all commands work with `/help`

## Step-by-Step Deployment

### 1. Install Heroku CLI
Download and install from: https://devcenter.heroku.com/articles/heroku-cli

### 2. Login to Heroku
```bash
heroku login
```

### 3. Create Heroku App
```bash
heroku create fightbot-free
# Or use your preferred app name:
# heroku create your-app-name
```

### 4. Set Environment Variables
```bash
# Discord Configuration (REQUIRED)
heroku config:set DISCORD_TOKEN=your_production_bot_token
heroku config:set CLIENT_ID=your_production_client_id

# Optional: Guild-specific deployment (faster command updates)
heroku config:set GUILD_ID=your_production_guild_id

# Production Environment
heroku config:set NODE_ENV=production
```

Set this in Heroku:
```bash
heroku config:set WEBHOOK_URL=https://your-app-name.herokuapp.com/webhook/stripe
```

### 6. Deploy to Heroku
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### 7. Deploy Discord Commands Globally
```bash
heroku run npm run deploy:global
```

### 8. View Logs
```bash
heroku logs --tail
```

## Post-Deployment Setup

### 1. Update Stripe Webhook
- Go to your Stripe Dashboard → Webhooks
- Edit your webhook endpoint
- Change URL to: `https://your-app-name.herokuapp.com/webhook/stripe`
- Copy the new webhook secret and update Heroku:
```bash
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_new_webhook_secret
```

### 2. Test Your Bot
- Check if bot is online in Discord
- Test `/subscribe` command
- Test payment flow
- Verify webhooks work

## Useful Heroku Commands

```bash
# View environment variables
heroku config

# View logs
heroku logs --tail

# Restart app
heroku restart

# Open app in browser
heroku open

# Run commands on Heroku
heroku run npm run deploy:global
heroku run npm run setup:check

# Scale dynos (if needed)
heroku ps:scale web=1
```

## Environment Variables Checklist

Make sure you set all these on Heroku:

- ✅ `DISCORD_TOKEN` (production bot token)
- ✅ `CLIENT_ID` (production client ID)  
- ✅ `GUILD_ID` (optional, remove for global commands)
- ✅ `STRIPE_SECRET_KEY` (sk_live_... NOT test key!)
- ✅ `STRIPE_PUBLISHABLE_KEY` (pk_live_... NOT test key!)
- ✅ `STRIPE_PRICE_ID` (price_... from live mode)
- ✅ `STRIPE_WEBHOOK_SECRET` (whsec_... from live webhook)
- ✅ `WEBHOOK_URL` (https://your-app.herokuapp.com/webhook/stripe)
- ✅ `NODE_ENV=production`
- ✅ `WEBHOOK_PORT=3000`

## Troubleshooting

### Bot Not Starting
```bash
heroku logs --tail
```
Check for missing environment variables or errors.

### Webhook Not Working
1. Verify `WEBHOOK_URL` is correct
2. Check Stripe webhook settings
3. Verify `STRIPE_WEBHOOK_SECRET` matches

### Commands Not Working
```bash
heroku run npm run deploy:global
```

### Database Issues
The SQLite database will reset on Heroku restarts. For production, consider upgrading to PostgreSQL:
```bash
heroku addons:create heroku-postgresql:mini
```

## Monitoring

- **App Status**: `heroku ps`
- **Logs**: `heroku logs --tail`
- **Metrics**: Heroku Dashboard
- **Health Check**: `https://your-app.herokuapp.com/health`

## Costs

- **Heroku**: $7/month for Eco dyno (recommended)
- **Stripe**: 2.9% + 30¢ per transaction
- **Total**: ~$7-15/month depending on usage
