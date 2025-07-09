# ⚙️ Configuration Guide

This guide covers all configuration options for FightBot.

## Environment Variables

FightBot requires several environment variables to be set. Create a `.env` file in the root directory:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_application_client_id
GUILD_ID=your_discord_server_guild_id_for_testing

# UFC API Configuration (if applicable)
UFC_API_KEY=your_ufc_api_key_if_needed
UFC_API_BASE_URL=https://api.ufc.com/v3

# Bot Configuration
NODE_ENV=development
LOG_LEVEL=info
```

## Required Variables

### Discord Configuration

- **`DISCORD_TOKEN`** *(Required)*
  - Your Discord bot token from the Discord Developer Portal
  - Used to authenticate the bot with Discord
  - Keep this secret and never commit to version control

- **`CLIENT_ID`** *(Required)*
  - Your Discord application's client ID
  - Used for deploying slash commands
  - Found in the Discord Developer Portal

- **`GUILD_ID`** *(Optional)*
  - Your Discord server's guild ID for testing
  - When set, commands are registered only to this server (faster deployment)
  - Omit for global command deployment (takes up to 1 hour)

## Configuration Validation

The bot validates required environment variables on startup:

```javascript
// config.js automatically validates:
if (!token) {
    console.error('❌ DISCORD_TOKEN is required in environment variables');
    process.exit(1);
}

if (!clientId) {
    console.error('❌ CLIENT_ID is required in environment variables');
    process.exit(1);
}
```

## Development vs Production

### Development Configuration
```env
NODE_ENV=development
GUILD_ID=your_test_server_id  # For faster command deployment
LOG_LEVEL=debug
```

### Production Configuration
```env
NODE_ENV=production
# Omit GUILD_ID for global commands
LOG_LEVEL=info
```

## Security Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use environment variables** in production hosting
3. **Rotate tokens regularly** - Regenerate bot tokens periodically
4. **Limit bot permissions** - Only grant necessary Discord permissions

## Troubleshooting Configuration

### Bot Won't Start
- Check that all required environment variables are set
- Verify DISCORD_TOKEN is valid
- Ensure CLIENT_ID matches your Discord application

### Commands Not Appearing
- Check GUILD_ID is correct (if using guild-specific deployment)
- Wait up to 1 hour for global commands
- Verify bot has necessary permissions in the server

### Permission Errors
- Ensure bot has `applications.commands` scope
- Grant appropriate server permissions
- Check Discord Developer Portal settings

## See Also

- [Deployment Guide](../deployment/DEPLOYMENT.md) - How to deploy with configuration
- [Troubleshooting](../user/TROUBLESHOOTING.md) - Common configuration issues
- [API Reference](../developer/API-REFERENCE.md) - Configuration code examples
