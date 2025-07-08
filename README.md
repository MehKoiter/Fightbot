# 🥊 FightBot Premium - Ultimate UFC Discord Bot

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-14.8.0-blue.svg)](https://discord.js.org/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0--premium-purple.svg)](package.json)

![FightBot Logo](img/mmaGloveSmall.png)

FightBot Premium is the most advanced UFC Discord bot available, offering comprehensive fight data, real-time betting odds, AI-powered analytics, and personalized features for the ultimate MMA experience.

## 🌟 Premium Features

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
   git clone https://github.com/yourusername/fightbot-premium.git
   cd fightbot-premium
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

### Premium Commands
- `/odds` - Real-time betting odds from multiple sportsbooks
- `/analytics` - Advanced fight analytics and AI predictions
- `/preferences` - Manage personal settings and notifications
- `/export` - Export fight data in various formats
- `/premium` - View premium dashboard and features
- `/support` - Access premium support and contact information

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
The bot supports both Free and Premium versions through the `config/version.js` file:

```javascript
export const VERSION_CONFIG = {
    version: "1.0.0-premium",
    type: "PREMIUM", // FREE or PREMIUM
    features: {
        // Core features (available in both versions)
        basicFightCard: true,
        upcomingEvents: true,
        // Premium features
        advancedAnalytics: true,
        betOddsTracking: true,
        exportData: true,
        personalizedFeed: true
    }
};
```

### User Preferences
Premium users can customize their experience:
- **Notifications** - Fight results, odds changes, favorite fighters
- **Display** - Timezone, odds format, spoiler settings
- **Betting** - Preferred sportsbooks, alert thresholds
- **Favorites** - Fighters, weight classes, organizations

## 🧪 Testing

Run the comprehensive test suite:
```bash
npm test           # Full premium test suite
npm run test:simple # Basic functionality test
npm run test:ufc   # UFC service connectivity test
```

## 📁 Project Structure

```
fightbot-premium/
├── commands/          # Slash command implementations
│   ├── analytics.js   # AI-powered fight analytics
│   ├── export.js      # Data export functionality
│   ├── fight.js       # Main fight card command
│   ├── help.js        # Comprehensive help system
│   ├── info.js        # Bot information
│   ├── odds.js        # Betting odds tracking
│   ├── preferences.js # User preference management
│   ├── premium.js     # Premium feature dashboard
│   └── support.js     # Support and contact info
├── config/            # Configuration files
│   └── version.js     # Version and feature flags
├── events/            # Discord event handlers
│   ├── interactionCreate.js # Button and command handling
│   └── ready.js       # Bot initialization
├── services/          # Core business logic
│   ├── bettingOddsService.js    # Betting odds integration
│   ├── eventCache.js            # Event data caching
│   ├── fightParser.js           # Fight data parsing
│   ├── notificationService.js   # Premium notifications
│   ├── ufcService.js            # UFC data fetching
│   └── userPreferencesService.js # User settings
└── test-premium.js    # Comprehensive test suite
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
- **Live Fight Updates** - Real-time round-by-round scoring
- **Multi-Event Tracking** - Follow multiple promotions
- **Custom Dashboards** - Personalized fight tracking
- **Advanced Integrations** - Third-party service connections
- **Mobile App Support** - Companion mobile application

### API Enhancements
- **Real Sportsbook Integration** - Live API connections
- **Enhanced Fighter Database** - Comprehensive fighter profiles
- **Video Highlights** - Fight clip integration
- **Social Features** - Community predictions and discussions

## 📊 Feature Comparison

| Feature | Free Version | Premium Version |
|---------|--------------|-----------------|
| Fight Cards | ✅ Basic (5 fights) | ✅ Complete (unlimited) |
| Fighter Stats | ✅ Basic records | ✅ Detailed analytics |
| Betting Odds | ❌ | ✅ Live tracking |
| Analytics | ❌ | ✅ AI-powered |
| Notifications | ❌ | ✅ Custom alerts |
| Data Export | ❌ | ✅ Multiple formats |
| Support | 📧 Email only | 🌟 Priority support |

## 💰 Premium Pricing

- **Monthly**: $9.99/month
- **Yearly**: $99.99/year (2 months free!)
- **Lifetime**: $299.99 (one-time payment)

Contact support for enterprise pricing and custom solutions.

## 📞 Support

### Premium Support
- **Priority Response** - 24-48 hour response time
- **Email Support** - premium@fightbot.com
- **Discord Community** - Join our support server
- **Documentation** - Comprehensive guides and tutorials

### General Support
- **Email** - support@fightbot.com
- **Bug Reports** - Include detailed reproduction steps
- **Feature Requests** - We love hearing your ideas!

## 🛡️ Security & Privacy

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