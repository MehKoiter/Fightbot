# FightBot - Replit Deployment Guide

## 🚀 Quick Setup for Replit

### 1. Import Repository
- Go to Replit.com and click "Create Repl"
- Choose "Import from GitHub"
- Enter repository URL: `https://github.com/MehKoiter/Fightbot`
- Click "Import from GitHub"

### 2. Environment Variables
Set up these required environment variables in Replit Secrets:

```
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_application_client_id
```

Optional (for guild-specific deployment):
```
GUILD_ID=your_discord_server_id
```

### 3. Setup Commands
Run these commands in the Replit Shell:

```bash
# Install dependencies
npm install

# Initialize database
npm run setup:init

# Deploy commands to Discord
npm run deploy

# Start the bot
npm start
```

### 4. Automatic Deployment
The bot will automatically start when you run the Repl. The `.replit` configuration file handles:
- Node.js 18 environment
- Automatic dependency installation
- Port configuration
- Environment setup

### 5. Getting Discord Bot Token

1. Go to https://discord.com/developers/applications
2. Click "New Application" and give it a name
3. Go to "Bot" section in left sidebar
4. Click "Add Bot"
5. Copy the token and add it to Replit Secrets as `DISCORD_TOKEN`
6. Copy the Application ID from "General Information" as `CLIENT_ID`

### 6. Bot Permissions
When inviting your bot to a server, make sure it has these permissions:
- Send Messages
- Use Slash Commands
- Embed Links
- Read Message History
- View Channels

### 7. Features Available
🎉 **All features are completely FREE!**
- `/fight` - View upcoming UFC events and fight cards
- `/features` - See all available features
- `/donate` - Support development (optional)
- `/account` - View account status
- `/help` - Get help with commands

### 8. Troubleshooting

**Bot not responding:**
- Check that `DISCORD_TOKEN` is set correctly in Secrets
- Ensure bot is invited to your server with proper permissions
- Check the Console for any error messages

**Commands not appearing:**
- Run `npm run deploy` to register slash commands
- For guild-specific deployment, set `GUILD_ID` in Secrets
- For global deployment, use `npm run deploy:global` (takes up to 1 hour)

**Database issues:**
- Run `npm run setup:init` to reinitialize the database
- Check that SQLite is working in the environment

### 9. Support
If you need help:
- Check the logs in Replit Console
- Use `/support` command in Discord
- Visit the GitHub repository for documentation

---

**🥊 FightBot - The Ultimate FREE UFC Discord Bot! 🥊**
