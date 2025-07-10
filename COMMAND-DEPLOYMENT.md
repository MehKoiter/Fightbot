# 🔧 Command Deployment Guide

## 🚨 Latest Fixes (v1.7.1-free)

### Fixed Issues:
- ✅ **Duplicate Commands**: Resolved duplicate command registrations
- ✅ **Interaction Errors**: Fixed DiscordAPIError[10062] in fighter command
- ✅ **Command Detection**: Added diagnostic tools to prevent issues
- ✅ **Deployment Process**: Streamlined command management

### New Tools Available:
- `npm run deploy:diagnose` - Check current command registrations
- `npm run deploy:cleanup` - Remove all command registrations
- `npm run test:fighter-timing` - Test interaction timing fixes

## Quick Fix for Duplicate Commands

If you see duplicate commands in Discord, run this cleanup:

```bash
# 1. Clean all existing commands
node utils/cleanup-commands.js

# 2. Deploy fresh commands (choose ONE method)
npm run deploy                    # Guild deployment (instant)
# OR
node deploy-commands.js --global  # Global deployment (takes 1 hour)
```

## Deployment Methods

### 🏠 Guild Deployment (Recommended for Development)
```bash
npm run deploy
```
- ✅ **Instant** - Commands appear immediately
- ✅ **Perfect for testing** - Only visible in your test server
- ❌ **Limited scope** - Only works in the specified guild

### 🌍 Global Deployment (Recommended for Production)
```bash
node deploy-commands.js --global
```
- ✅ **Works everywhere** - All servers can use the bot
- ✅ **Production ready** - No guild ID required
- ❌ **Slow propagation** - Takes up to 1 hour to update

## Important Rules

### ⚠️ NEVER DO BOTH
- **DO NOT** deploy commands both globally AND to a guild
- This creates duplicate commands in Discord
- Choose ONE method and stick with it

### 🔄 Switching Methods
If you need to switch from guild to global (or vice versa):

1. **Clean everything first:**
   ```bash
   node utils/cleanup-commands.js
   ```

2. **Deploy using your chosen method:**
   ```bash
   npm run deploy              # For guild
   # OR
   npm run deploy -- --global  # For global
   ```

## Troubleshooting

### Duplicate Commands
```bash
node utils/diagnose-commands.js  # Check current registrations
node utils/cleanup-commands.js   # Clean all commands
npm run deploy            # Re-deploy cleanly
```

### Missing Commands
```bash
npm run deploy  # Re-deploy all commands
```

### Wrong Commands Showing
```bash
node utils/cleanup-commands.js  # Clean everything
npm run deploy           # Deploy fresh
```

## Production Deployment

For production (like Render.com), commands are typically deployed during the build process. Make sure your deployment platform runs:

```bash
npm run deploy  # Or npm run deploy -- --global
```

During the build/start process to ensure commands are registered.
