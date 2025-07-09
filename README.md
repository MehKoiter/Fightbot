# 🥊 FightBot Free - UFC Discord Bot

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-14.8.0-blue.svg)](https://discord.js.org/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)](package.json)

![FightBot Logo](img/mmaGloveSmall.png)

FightBot Free is a comprehensive Discord bot that brings UFC fight information directly to your Discord server. Get real-time fight cards, fighter stats, and interactive features - all completely free!

## ✨ Features

### 🥊 Core Features
- **Interactive Fight Cards** - Rich embeds with clickable buttons for detailed exploration
- **Real-time UFC Data** - Latest fight information fetched directly from UFC sources
- **Fighter Records & Rankings** - Complete win/loss records and official UFC rankings
- **Event Information** - Venue details, fight times, and event schedules
- **Button Navigation** - Easy-to-use interactive buttons for exploring fight data

### 🎮 Interactive Buttons
- **📋 Show Prelims** - View preliminary card fights
- **📊 Fighter Records & Stats** - Detailed fighter statistics and records
- **🏟️ Venue Info** - Arena details and location information  
- **📈 Fight Analysis** - Basic fight breakdowns and matchup information
- **📅 Fight Times & Schedule** - Event timing and broadcast information
- **🔄 Refresh Data** - Update with the latest fight information
- **🌐 View on UFC.com** - Direct link to the official UFC event page

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Discord Bot Token
- Discord Server with appropriate permissions

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/fightbot-free.git
   cd fightbot-free
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with your Discord bot credentials:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   GUILD_ID=your_guild_id_here
   ```

4. **Deploy slash commands**
   ```bash
   npm run deploy
   ```

5. **Start the bot**
   ```bash
   npm start
   ```

## 🚀 Production Deployment

### Render.com Deployment (Recommended)

FightBot is optimized for deployment on Render.com with built-in health monitoring.

#### Prerequisites
- GitHub repository with your FightBot code
- Render.com account (free tier available)
- Discord bot token and application credentials

#### Deployment Steps

1. **Connect Repository**
   - Go to [render.com](https://render.com) and sign in
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `main` branch

2. **Configure Service**
   - **Name**: `fightbot-discord-bot`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free tier (sufficient for Discord bots)

3. **Set Environment Variables**
   Add these variables in the Environment section:
   ```
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here  
   GUILD_ID=your_guild_id_here
   NODE_ENV=production
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy
   - Monitor logs for successful startup: `Ready! Logged in as FightBot#xxxx`

#### Health Monitoring

FightBot includes a built-in HTTP health server that:
- ✅ Satisfies Render's port binding requirements
- ✅ Provides health check endpoint at `/health`
- ✅ Returns bot status, uptime, and version info
- ✅ Doesn't interfere with Discord bot functionality

**Health Check Response:**
```json
{
  "status": "healthy",
  "bot": "FightBot#9833", 
  "uptime": 3600,
  "version": "1.0.0-free",
  "timestamp": "2025-07-09T14:30:00.000Z"
}
```

#### Troubleshooting Deployment

**Port Binding Issues:**
- ✅ **Fixed**: FightBot automatically binds to `process.env.PORT` or port 3000
- The health server runs alongside the Discord bot without conflicts

**Environment Variable Issues:**
- Ensure all required variables are set in Render dashboard
- Check deployment logs for missing variable errors
- Variables should match your local `.env` file exactly

**Bot Not Responding:**
- Check deployment logs for login errors
- Verify Discord token is valid and has correct permissions
- Ensure bot is invited to your server with proper permissions

### Alternative Deployment Options

#### Railway.com
- Similar setup to Render
- May require additional port configuration
- Environment variables set in dashboard

#### Heroku
- Add `Procfile`: `web: npm start`
- Configure environment variables in settings
- Enable health checks for monitoring

#### VPS/Dedicated Server
- Install Node.js 18+
- Use PM2 for process management: `pm2 start index.js --name fightbot`
- Configure reverse proxy if needed
- Set up SSL certificates for HTTPS

### Post-Deployment Checklist

- [ ] Bot shows as online in Discord
- [ ] `/fight` command works and returns data
- [ ] Health endpoint responds at your-app-url/health
- [ ] No errors in deployment logs
- [ ] Interactive buttons function properly
- [ ] Bot responds to commands in your server

### Monitoring & Maintenance

**Render Monitoring:**
- Check deployment logs regularly
- Monitor health endpoint uptime
- Watch for memory/CPU usage

**Discord Monitoring:**
- Verify bot stays online 24/7
- Test commands periodically
- Monitor for API rate limiting

**Updates:**
- Push updates to main branch for auto-deployment
- Test in development environment first
- Monitor logs during deployments

## 📋 Available Commands

### Core Commands
- `/fight` - Display the upcoming UFC fight card with interactive buttons
- `/info` - Show bot information, version details, and available features
- `/help` - Display comprehensive help and command information
- `/support` - Get support information and contact details

## 🎯 How to Use

1. **Get Fight Information**
   ```
   /fight
   ```
   This displays the next UFC event with an interactive fight card.

2. **Explore with Buttons**
   Click the buttons below the fight card to:
   - View preliminary fights
   - See detailed fighter records
   - Get venue and timing information
   - Access fight analysis
   - Refresh data for updates

3. **Get Help**
   ```
   /help
   ```
   Shows all available commands and features.

## 🔧 Configuration

The bot is configured for the free version with these settings:
- **Fight Display Limit**: Up to 5 main card fights
- **Event Queries**: 1 upcoming event at a time
- **Cache Duration**: 1 hour for optimal performance
- **Request Limits**: 50 requests per hour

## 📁 Project Structure

```
fightbot-free/
├── commands/          # Slash command implementations
│   ├── fight.js       # Main fight card command
│   ├── help.js        # Help and documentation
│   ├── info.js        # Bot information
│   ├── premium.js     # Premium upgrade information
│   └── support.js     # Support and contact info
├── config/            # Configuration files
│   └── version.js     # Version and feature flags
├── events/            # Discord event handlers
│   ├── interactionCreate.js # Button and command handling
│   └── ready.js       # Bot initialization
├── services/          # Core business logic
│   ├── eventCache.js  # Event data caching
│   ├── fightParser.js # Fight data parsing
│   └── ufcService.js  # UFC data fetching
└── img/               # Bot assets
```

## 🧪 Testing

Test the bot functionality:
```bash
npm test:simple       # Basic functionality test
npm run test:ufc      # UFC service connectivity test
```

## 🔧 Development

For development with auto-restart:
```bash
npm run dev
```

## 📞 Support

### Community Support
- **GitHub Issues** - Report bugs and request features
- **Email** - jess54191@gmail.com
- **Documentation** - This README and in-app help commands

### Getting Help
1. Use `/help` command for bot usage information
2. Use `/support` command for contact details
3. Check GitHub issues for common problems
4. Email us for technical support

## 🛡️ Security & Privacy

- **No Personal Data** - We only store necessary Discord user IDs
- **Secure API Calls** - All external API calls are encrypted
- **Open Source** - Code is publicly available for review
- **Regular Updates** - Security patches and improvements

## 📄 License

This project is licensed under the ISC License. See the LICENSE file for details.

## 🤝 Contributing

We welcome contributions to FightBot Free! 

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

## 🏆 Acknowledgments

- **UFC** - For providing comprehensive fight data
- **Discord.js** - For the excellent Discord API library
- **MMA Community** - For feedback and feature suggestions
- **Contributors** - Thank you to everyone who helps improve FightBot!

## 🗺️ Project Roadmap

For detailed project planning, roadmap, and development status, see [ROADMAP.md](ROADMAP.md).

---

**FightBot Free** - Bringing the excitement of UFC directly to your Discord server! 🥊

*Ready for more features? Use `/premium` to learn about our premium tier!*

## 📊 Stats & Info

- **Latest Version**: 1.0.0
- **Release Date**: July 2025
- **Discord Servers**: Growing daily
- **Commands Available**: 5 core commands
- **Interactive Buttons**: 7 different actions
- **Data Sources**: Official UFC feeds

Start using FightBot Free today and never miss another UFC event! 🚀
