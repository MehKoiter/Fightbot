# FightBot Production Deployment

## Prerequisites

1. **Production Discord Bot**
   - Create a new Discord application at https://discord.com/developers/applications
   - Get the production bot token and client ID
   - Invite the bot to your production server

2. **Production Stripe Account**
   - Switch to live mode in Stripe dashboard
   - Get live API keys (sk_live_... and pk_live_...)
   - Create live products and prices
   - Set up live webhooks

## Deployment Options

### Railway (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Railway**
   - Go to https://railway.app
   - Connect your GitHub repository
   - Set environment variables in Railway dashboard
   - Deploy automatically

3. **Set Environment Variables in Railway**
   ```
   DISCORD_TOKEN=your_production_token
   CLIENT_ID=your_production_client_id
   STRIPE_SECRET_KEY=sk_live_your_key
   STRIPE_PUBLISHABLE_KEY=pk_live_your_key
   STRIPE_PRICE_ID=price_your_live_price
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   WEBHOOK_URL=https://your-app.railway.app/webhook/stripe
   NODE_ENV=production
   ```

### Heroku

1. **Install Heroku CLI**
2. **Create Heroku App**
   ```bash
   heroku create fightbot-production
   ```
3. **Set Environment Variables**
   ```bash
   heroku config:set DISCORD_TOKEN=your_token
   heroku config:set STRIPE_SECRET_KEY=sk_live_your_key
   # ... set all other variables
   ```
4. **Deploy**
   ```bash
   git push heroku main
   ```

### Docker

1. **Build Image**
   ```bash
   docker build -t fightbot .
   ```

2. **Run Container**
   ```bash
   docker-compose up -d
   ```

## Post-Deployment Steps

1. **Update Stripe Webhook URL**
   - Go to Stripe Dashboard → Webhooks
   - Update endpoint URL to: `https://yourdomain.com/webhook/stripe`
   - Update webhook secret in environment variables

2. **Register Discord Commands**
   ```bash
   npm run deploy:global  # For global commands
   ```

3. **Test Everything**
   - Test `/subscribe` command
   - Test payment flow
   - Test webhooks
   - Test `/account` management

## Environment Variables Reference

```env
# Discord Configuration
DISCORD_TOKEN=your_production_bot_token
CLIENT_ID=your_production_client_id
GUILD_ID=optional_for_guild_specific_commands

# Stripe Configuration (LIVE KEYS)
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_PRICE_ID=price_your_live_monthly_price_id
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret

# Server Configuration
WEBHOOK_URL=https://yourdomain.com/webhook/stripe
WEBHOOK_PORT=3000
NODE_ENV=production
```

## Monitoring

- **Health Check**: `https://yourdomain.com/health`
- **Bot Status**: Monitor Discord bot online status
- **Logs**: Check platform logs for errors
- **Stripe**: Monitor webhook delivery in Stripe dashboard

## Security Notes

- Never commit `.env` files with real credentials
- Use live Stripe keys only in production
- Keep webhook secrets secure
- Monitor failed webhook deliveries
- Set up proper error alerting
