# FightBot Payment & User Tracking Setup Guide

This guide will walk you through setting up payment processing and user tracking for FightBot Premium.

## 📋 Prerequisites

- Node.js 18+ installed
- Discord Bot Token and Application configured
- Stripe account (for payments)
- Domain with HTTPS (for webhooks in production)

## 🔧 Step 1: Environment Configuration

1. Copy the `.env.example` file to `.env`
2. Fill in your configuration:

```bash
# Discord Bot Configuration
DISCORD_TOKEN=your_actual_bot_token
CLIENT_ID=your_actual_client_id
GUILD_ID=your_actual_guild_id

# Stripe Payment Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID=price_your_monthly_subscription_price_id

# Webhook Server Configuration
WEBHOOK_PORT=3000
WEBHOOK_URL=https://your-domain.com/webhook/stripe
```

## 💳 Step 2: Stripe Setup

### 2.1 Create Stripe Account
1. Sign up at [stripe.com](https://stripe.com)
2. Complete account verification

### 2.2 Get API Keys
1. Go to Stripe Dashboard → Developers → API Keys
2. Copy your `Publishable key` and `Secret key`
3. Add them to your `.env` file

### 2.3 Create Product and Price
1. Go to Stripe Dashboard → Products
2. Create a new product: "FightBot Premium"
3. Add a recurring price: $4.99/month
4. Copy the Price ID (starts with `price_`) to your `.env`

### 2.4 Configure Webhooks
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/webhook/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated` 
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret to your `.env`

## 🗄️ Step 3: Database Setup

The bot automatically creates an SQLite database (`fightbot.db`) on first run.

### Database Schema
- **users**: User profiles and subscription status
- **payments**: Payment history and transactions
- **usage_logs**: Command usage tracking
- **subscriptions**: Subscription management

## 🚀 Step 4: Deployment

### 4.1 Install Dependencies
```bash
npm install
```

### 4.2 Deploy Commands
```bash
npm run deploy
```

### 4.3 Start Bot
```bash
npm start
```

## 🌐 Step 5: Production Deployment

### 5.1 Domain & SSL
- Purchase a domain name
- Set up SSL certificate (Let's Encrypt recommended)
- Point domain to your server

### 5.2 Process Manager (PM2)
```bash
npm install -g pm2
pm2 start index.js --name "fightbot"
pm2 startup
pm2 save
```

### 5.3 Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location /webhook/stripe {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /health {
        proxy_pass http://localhost:3000;
    }
}
```

## 📊 Step 6: Available Commands

### User Commands
- `/subscribe` - Subscribe to Premium
- `/account` - View account status and manage subscription
- `/premium` - View Premium features
- `/help` - Get help and support

### Admin Commands (Requires Administrator permission)
- `/admin stats` - View subscription statistics
- `/admin user @user` - View specific user information
- `/admin revenue` - View revenue analytics

## 🔒 Step 7: Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **Webhook Security**: Verify webhook signatures
3. **Database**: Regular backups of SQLite database
4. **SSL**: Always use HTTPS in production
5. **Rate Limiting**: Monitor for abuse
6. **Logs**: Monitor application logs for errors

## 📈 Step 8: Monitoring & Analytics

### Key Metrics to Track
- Total users vs Premium users
- Conversion rate (free → premium)
- Monthly recurring revenue (MRR)
- Churn rate
- Command usage patterns

### Database Queries
The admin commands provide built-in analytics, or query directly:

```sql
-- Total users
SELECT COUNT(*) FROM users;

-- Active subscriptions
SELECT COUNT(*) FROM users WHERE subscription_status = 'active';

-- Monthly revenue
SELECT COUNT(*) * 4.99 as mrr FROM users WHERE subscription_status = 'active';
```

## 🛠️ Step 9: Testing

### Test Payment Flow
1. Use Stripe test mode
2. Use test card: `4242 4242 4242 4242`
3. Test subscription creation, updates, and cancellation
4. Verify webhook processing

### Test Commands
```bash
# Test basic functionality
npm run test

# Test specific UFC service
npm run test:ufc
```

## 🚨 Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL is publicly accessible
   - Verify SSL certificate
   - Check webhook secret matches

2. **Database errors**
   - Ensure write permissions for SQLite file
   - Check database file isn't corrupted

3. **Stripe errors**
   - Verify API keys are correct
   - Check test vs live mode consistency
   - Ensure webhook endpoint is configured

### Logs
Check application logs for detailed error information:
```bash
# If using PM2
pm2 logs fightbot

# Or check direct output
npm start
```

## 📞 Support

For issues with this setup:
1. Check the troubleshooting section
2. Review application logs
3. Test with Stripe's test environment
4. Contact support via `/support` command

## 💡 Additional Features

You can extend the system with:
- Annual subscription discounts
- Multiple subscription tiers
- Referral systems
- Usage-based pricing
- Enterprise plans

---

## 🔄 Payment Flow Overview

1. User runs `/subscribe` command
2. Bot creates Stripe payment link
3. User completes payment on Stripe
4. Stripe sends webhook to bot
5. Bot updates user's subscription status
6. User gains access to premium features

The system is designed to be robust, scalable, and secure for production use.
