# 🥊 FightBot - Ultimate FREE UFC Discord Bot

> **UPDATE:** Migration to the new modular architecture is now complete! See the [ARCHITECTURE.md](ARCHITECTURE.md) and [MIGRATION.md](MIGRATION.md) files for details about the new structure.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-14.8.0-blue.svg)](https://discord.js.org/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0--free-green.svg)](package.json)

![FightBot Logo](img/mmaGloveSmall.png)

**🎉 ALL FEATURES ARE NOW COMPLETELY FREE! 🎉**

FightBot is the ultimate UFC Discord bot offering comprehensive fight data, real-time betting odds, advanced analytics, and all premium features - **completely FREE for everyone!**

## 🌟 Features (All FREE!)

### 🥊 Advanced Fight Data
- **Interactive Fight Cards** - Rich embeds with clickable buttons for detailed exploration
- **Real-time Updates** - Automatic refresh of fight data and event information
- **Comprehensive Fighter Stats** - Complete records, rankings, and performance metrics
- **Event Analysis** - In-depth breakdowns of upcoming events and matchups

### 💰 Betting Integration
- **Live Odds Tracking** - Real-time odds from major sportsbooks (DraftKings, FanDuel, BetMGM, etc.)
- **Odds Movement Alerts** - Notifications for significant line movements
- **Best Odds Comparison** - Find the best lines across multiple books
- **Method of Victory Odds** - Detailed prop betting information

### 🤖 AI-Powered Analytics
- **Win Probability Calculations** - AI-driven fight predictions
- **Performance Trend Analysis** - Fighter momentum and form tracking
- **Style Matchup Breakdowns** - Detailed analysis of fighting style compatibility
- **Historical Comparisons** - Head-to-head statistical analysis

### ⚙️ Personalization
- **Custom Preferences** - Personalized notification settings and display options
- **Favorite Fighter Tracking** - Alerts for your favorite athletes
- **Timezone Support** - Localized event times and dates
- **Multiple Odds Formats** - American, Decimal, or Fractional odds display

### 📊 Data Export & Reporting
- **Multiple Export Formats** - JSON, CSV, and PDF report generation
- **Fight Card Downloads** - Save complete event information
- **Analytics Reports** - Detailed statistical analysis documents
- **Historical Data Access** - Export past event data and results

### 🔔 Smart Notifications
- **Fight Result Alerts** - Instant notifications when fights end
- **Event Reminders** - Never miss an important card
- **Odds Movement Tracking** - Get notified of significant line changes
- **Breaking News Updates** - Stay informed of the latest MMA news

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
   # Edit .env with your Discord bot token and settings
   ```

4. **Deploy slash commands**
   ```bash
   npm run deploy
   ```

5. **Start the bot**
   ```bash
   npm start
   ```

## 📋 Available Commands

### Core Commands
- `/fight` - Display upcoming UFC fight card with interactive buttons
- `/info` - Show bot information and version details
- `/help` - Display comprehensive help and feature list

### Advanced Commands (All FREE!)
- `/odds` - Real-time betting odds from multiple sportsbooks
- `/analytics` - Advanced fight analytics and predictions
- `/preferences` - Manage personal settings and notifications
- `/export` - Export fight data in various formats
- `/features` - View all available features (everything is FREE!)
- `/donate` - Support FightBot development via Patreon
- `/account` - View your account information
- `/support` - Access support and contact information

## 🎮 Interactive Features

### Fight Card Buttons
- **📋 Show Prelims** - View preliminary card fights
- **📊 Fighter Records & Stats** - Detailed fighter statistics
- **🏟️ Venue Info** - Arena details and location information
- **📈 Fight Analysis** - In-depth matchup analysis
- **📅 Fight Times & Schedule** - Event timing and broadcast info
- **🔄 Refresh Data** - Update with latest information
- **🌐 View on UFC.com** - Direct link to official UFC page

### Analytics Options
- **Win Probability** - AI-calculated win percentages
- **Performance Trends** - Recent form and momentum analysis
- **Style Matchup** - Fighting style compatibility breakdown
- **Historical Comparison** - Career and statistical comparisons

## ⚙️ Configuration

### Version Settings
FightBot is now completely FREE with all features enabled:

```javascript
export const VERSION_CONFIG = {
    version: "1.0.0-free",
    type: "FREE", // All features are FREE
    features: {
        // ALL features are available for FREE
        basicFightCard: true,
        upcomingEvents: true,
        advancedAnalytics: true,
        betOddsTracking: true,
        exportData: true,
        personalizedFeed: true,
        detailedStats: true,
        customNotifications: true,
        // ... all features enabled!
    }
};
```

### User Preferences
All users can customize their experience:
- **Notifications** - Fight results, odds changes, favorite fighters
- **Display** - Timezone, odds format, spoiler settings  
- **Betting** - Preferred sportsbooks, alert thresholds
- **Favorites** - Fighters, weight classes, organizations

## ❤️ Support FightBot

**All features are FREE, but you can support development:**
- **[Patreon](https://patreon.com/fightbot)** - Monthly donations to fund development
- **Spread the word** - Tell other MMA fans about FightBot
- **Report bugs** - Help us improve by reporting issues
- **Suggest features** - Let us know what you'd like to see next

Your support helps us:
- Keep the bot running 24/7
- Add new features faster
- Improve data accuracy
- Cover server and API costs

## 🧪 Testing

Run the comprehensive test suite:
```bash
npm test           # Full test suite
npm run test:simple # Basic functionality test
npm run test:ufc   # UFC service connectivity test
```

## 📁 Project Structure

```
fightbot-free/
├── commands/          # Slash command implementations
│   ├── analytics.js   # AI-powered fight analytics (FREE)
│   ├── export.js      # Data export functionality (FREE)
│   ├── fight.js       # Main fight card command
│   ├── help.js        # Comprehensive help system
│   ├── info.js        # Bot information
│   ├── odds.js        # Betting odds tracking (FREE)
│   ├── preferences.js # User preference management (FREE)
│   ├── features.js    # Feature showcase (all FREE)
│   ├── donate.js      # Patreon support info
│   └── support.js     # Support and contact info
├── config/            # Configuration files
│   └── version.js     # Version and feature flags (all FREE)
├── events/            # Discord event handlers
│   ├── interactionCreate.js # Button and command handling
│   └── ready.js       # Bot initialization
├── services/          # Core business logic
│   ├── bettingOddsService.js    # Betting odds integration (FREE)
│   ├── eventCache.js            # Event data caching
│   ├── fightParser.js           # Fight data parsing
│   ├── notificationService.js   # Notifications (FREE)
│   ├── ufcService.js            # UFC data fetching
│   └── userPreferencesService.js # User settings (FREE)
└── test-free.js       # Comprehensive test suite
```

## 🔧 Technical Features

### Caching System
- **In-memory caching** for frequently accessed data
- **Automatic cache invalidation** based on configurable timeouts
- **Fallback mechanisms** for cache misses

### Error Handling
- **Comprehensive error catching** at all levels
- **Graceful degradation** when services are unavailable
- **User-friendly error messages** with helpful suggestions

### Performance Optimization
- **Efficient data fetching** with minimal API calls
- **Lazy loading** of heavy resources
- **Response time monitoring** and optimization

### Security
- **Input validation** for all user interactions
- **Rate limiting** to prevent abuse
- **Secure configuration** management

## 🎯 Roadmap

### Upcoming Features
- **Live Fight Updates** - Real-time round-by-round scoring (FREE)
- **Multi-Event Tracking** - Follow multiple promotions (FREE)
- **Custom Dashboards** - Personalized fight tracking (FREE)
- **Advanced Integrations** - Third-party service connections (FREE)
- **Mobile App Support** - Companion mobile application (FREE)

### API Enhancements
- **Real Sportsbook Integration** - Live API connections (FREE)
- **Enhanced Fighter Database** - Comprehensive fighter profiles (FREE)
- **Video Highlights** - Fight clip integration (FREE)
- **Social Features** - Community predictions and discussions (FREE)

## 🎉 All Features Are FREE!

**Every feature that was previously premium is now completely FREE:**
- ✅ **Complete Fight Cards** - Unlimited fights and events
- ✅ **Detailed Fighter Stats** - Advanced analytics and records
- ✅ **Live Betting Odds** - Real-time tracking from multiple sources
- ✅ **Advanced Analytics** - AI-powered predictions and insights
- ✅ **Custom Notifications** - Personalized alerts and reminders
- ✅ **Data Export** - Download in multiple formats
- ✅ **Priority Support** - Fast response times for everyone
- ✅ **All Premium Features** - No restrictions whatsoever

**No subscriptions, no paywalls, no limitations - just great UFC data for everyone!**

## 📞 Support

### Community Support
- **Free for Everyone** - All features available to all users
- **Email Support** - support@fightbot.com
- **Discord Community** - Join our support server
- **Documentation** - Comprehensive guides and tutorials
- **Bug Reports** - Include detailed reproduction steps
- **Feature Requests** - We love hearing your ideas!

### Support Development ❤️
- **Patreon** - [patreon.com/fightbot](https://patreon.com/fightbot)
- **Spread the Word** - Tell others about FightBot
- **Report Bugs** - Help us improve
- **Suggest Features** - Share your ideas

## 🛡️ Security & Privacy

> **IMPORTANT SECURITY NOTICE:** Never commit your `.env` file or expose your Discord bot token. If you believe your token has been exposed, immediately regenerate it in the Discord Developer Portal.

- **Data Protection** - Your preferences and data are kept secure
- **No Personal Information** - We only store Discord user IDs and preferences
- **Secure API Calls** - All external API calls are encrypted
- **Regular Updates** - Security patches and improvements

## 📄 License

This project is licensed under the ISC License. See the LICENSE file for details.

## 🤝 Contributing

We welcome contributions! Please read our contributing guidelines and submit pull requests for any improvements.

### Development Setup
```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Run tests
npm test

# Deploy commands to test server
npm run deploy
```

## 🏆 Acknowledgments

- **UFC** - For providing comprehensive fight data
- **Discord.js** - For the excellent Discord API library
- **MMA Community** - For feedback and feature suggestions

---

**FightBot Premium** - Elevating your MMA experience with cutting-edge technology and comprehensive fight data. 🥊🤖

*Ready to upgrade? Use `/premium` in Discord to learn more!*