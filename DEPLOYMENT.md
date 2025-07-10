# 🚀 FightBot Deployment Guide

This guide covers deploying FightBot to production hosting platforms with detailed troubleshooting and best practices.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Render.com Deployment](#rendercom-deployment)
3. [Heroku Deployment](#heroku-deployment)
4. [VPS/Self-Hosted Deployment](#vpsself-hosted-deployment)
5. [Health Monitoring](#health-monitoring)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

## Prerequisites

### Discord Bot Setup
- Discord bot token from [Discord Developer Portal](https://discord.com/developers/applications)
- Bot invited to your server with proper permissions:
  - `Send Messages`
  - `Use Slash Commands`
  - `Embed Links`
  - `Read Message History`

### Required Environment Variables
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here
NODE_ENV=production
```

## Render.com Deployment

### Why Render?
- ✅ Free tier with 512MB RAM
- ✅ Automatic deployments from GitHub
- ✅ Built-in SSL and custom domains
- ✅ Easy environment variable management
- ✅ Excellent for Discord bots

### Step-by-Step Deployment

1. **Prepare Repository**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Create Render Service**
   - Go to [render.com](https://render.com)
   - Sign up/login with GitHub
   - Click "New +" → "Web Service"
   - Select your repository
   - Choose `main` branch

3. **Configure Build Settings**
   ```
   Name: fightbot-discord-bot
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Set Environment Variables**
   In the Environment section:
   ```
   DISCORD_TOKEN → your_bot_token_here
   CLIENT_ID → your_client_id_here
   GUILD_ID → your_guild_id_here
   NODE_ENV → production
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Monitor build logs
   - Wait for "Ready! Logged in as FightBot#xxxx"

### Render-Specific Features

**Automatic Deployments:**
- Pushes to `main` branch trigger automatic redeployment
- No manual intervention required

**Health Checks:**
- FightBot includes built-in health server
- Available at: `https://your-app-name.onrender.com/health`
- Returns bot status and uptime information

**Logs & Monitoring:**
- Real-time logs in Render dashboard
- Deployment history and rollback options
- Resource usage monitoring

## 🆕 **Recent Deployment Improvements (v1.7.0-free)**

### ✅ **Fixed Known Issues**
- **Discord API Error Fix**: Resolved DiscordAPIError[10062] "Unknown interaction" 
- **Improved Error Handling**: Better error recovery and user feedback
- **Production Optimizations**: Enhanced performance for deployment platforms
- **Health Check Reliability**: More robust health monitoring endpoints

### 🧪 **Enhanced Testing**
- **Pre-deployment Tests**: Run `npm run test:comprehensive` before deploying
- **Production Validation**: Automated testing suite ensures deployment readiness
- **Zero-downtime Updates**: Improved deployment process with better error handling

### 📊 **Monitoring & Debugging**
- **Enhanced Logging**: Better error reporting in production logs
- **Health Metrics**: Comprehensive health check responses
- **Debug Information**: Improved troubleshooting capabilities

## Heroku Deployment

### Setup

1. **Create Procfile**
   ```
   web: npm start
   ```

2. **Configure Environment**
   ```bash
   heroku config:set DISCORD_TOKEN=your_token_here
   heroku config:set CLIENT_ID=your_client_id
   heroku config:set GUILD_ID=your_guild_id
   heroku config:set NODE_ENV=production
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

## VPS/Self-Hosted Deployment

### Server Requirements
- Node.js 18+ installed
- PM2 for process management
- Git for code deployment
- Nginx (optional, for reverse proxy)

### Setup Steps

1. **Install Dependencies**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   npm install -g pm2
   ```

2. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/fightbot.git
   cd fightbot
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your values
   ```

4. **Start with PM2**
   ```bash
   pm2 start index.js --name fightbot
   pm2 startup
   pm2 save
   ```

## Health Monitoring

### Built-in Health Server

FightBot includes an HTTP health server that:

**Endpoints:**
- `GET /` - Basic health check
- `GET /health` - Detailed status information

**Response Format:**
```json
{
  "status": "healthy",
  "bot": "FightBot#9833",
  "uptime": 3600,
  "version": "1.0.0-free",
  "timestamp": "2025-07-09T14:30:00.000Z"
}
```

**Purpose:**
- Satisfies hosting platform port binding requirements
- Provides monitoring endpoint for uptime services
- Enables load balancer health checks
- Doesn't interfere with Discord bot functionality

### External Monitoring

**Uptime Monitoring:**
- Use services like UptimeRobot or Pingdom
- Monitor your health endpoint
- Set up alerts for downtime

**Discord Monitoring:**
- Check bot online status
- Monitor command response times
- Track error rates in logs

## Troubleshooting

### Common Issues

**1. Port Binding Errors**
```
Port scan timeout reached, no open ports detected
```
**Solution:** Health server automatically handles this
- Server binds to `process.env.PORT` or 3000
- No additional configuration needed

**2. Environment Variables Not Loading**
```
DISCORD_TOKEN is required in environment variables
```
**Solution:** 
- Check hosting platform dashboard
- Ensure variables are set correctly
- Redeploy after adding variables

**3. Bot Not Responding**
```
Bot appears offline in Discord
```
**Solutions:**
- Check deployment logs for errors
- Verify Discord token is valid
- Ensure bot has proper permissions
- Check network connectivity

**4. Memory/Resource Issues**
```
Application crashed due to memory limit
```
**Solutions:**
- Upgrade to higher tier plan
- Optimize code for memory usage
- Implement better caching strategies

### Debugging Steps

1. **Check Deployment Logs**
   ```bash
   # Look for these success messages:
   ✅ Database tables created successfully
   ✅ Loaded command: fight
   ✅ Loaded event: interactionCreate
   Ready! Logged in as FightBot#xxxx
   ```

2. **Test Health Endpoint**
   ```bash
   curl https://your-app-name.onrender.com/health
   ```

3. **Verify Environment Variables**
   ```bash
   # Check if variables are loaded
   # Look for environment debug output in logs
   ```

4. **Test Discord Commands**
   ```
   /fight  # Should return fight card
   /info   # Should return bot information
   ```

## 🔧 **Latest Troubleshooting (v1.7.1-free)**

### Duplicate Commands in Discord
**Problem**: Seeing duplicate `/fight`, `/info`, `/fighter`, `/donate` commands

**Solution**:
```bash
# 1. Diagnose the issue
npm run deploy:diagnose

# 2. Clean all commands
npm run deploy:cleanup

# 3. Re-deploy properly
npm run deploy              # For guild deployment
# OR
npm run deploy:global       # For global deployment (choose ONE)
```

**Prevention**: Never deploy commands both globally AND to a guild.

### DiscordAPIError[10062]: Unknown interaction
**Problem**: Commands failing with "Unknown interaction" error

**Fixed in v1.7.1**: 
- ✅ Hybrid timing system prevents token expiration
- ✅ Smart defer logic only when needed
- ✅ Enhanced error recovery

**If still experiencing**:
```bash
# Test timing
npm run test:fighter-timing

# Check for conflicts
npm run deploy:diagnose
```

### Fighter Command Timeout Issues
**Problem**: `/fighter` command taking too long or failing

**Fixed in v1.7.1**:
- ✅ Fast responses for cached data (< 2.5s)
- ✅ Automatic defer for slow operations (> 2.5s)
- ✅ Better error handling and user feedback

**Test the fix**:
```bash
npm run test:fighter-timing
```

### Command Registration Issues
**Problem**: Commands not appearing or behaving incorrectly

**Solution**:
```bash
# Full reset and redeploy
npm run deploy:cleanup
npm run deploy
```

**Verification**:
```bash
npm run deploy:diagnose
```

## Best Practices

### Security
- ✅ Never commit tokens to git
- ✅ Use environment variables for secrets
- ✅ Regularly rotate Discord tokens
- ✅ Enable 2FA on hosting accounts

### Performance
- ✅ Use caching for API responses
- ✅ Implement request rate limiting
- ✅ Monitor memory usage
- ✅ Optimize database queries

### Reliability
- ✅ Implement proper error handling
- ✅ Use health checks for monitoring
- ✅ Set up automated backups
- ✅ Test deployments in staging first

### Maintenance
- ✅ Monitor logs regularly
- ✅ Update dependencies monthly
- ✅ Test after each deployment
- ✅ Keep documentation updated

## Support

### Getting Help
- **GitHub Issues**: Report bugs and request features
- **Email**: jess54191@gmail.com
- **Discord**: Test commands with `/support`

### Documentation
- **README.md**: General usage and setup
- **This Guide**: Detailed deployment instructions
- **Code Comments**: In-line documentation

---

**Deployment Complete!** 🎉

Your FightBot should now be running in production. Monitor the health endpoint and Discord functionality to ensure everything is working properly.

For additional support or questions, don't hesitate to reach out through the channels listed above.
