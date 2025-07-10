# 🔧 FightBot Troubleshooting Guide

Common issues and their solutions for FightBot users and administrators.

## 🚨 Common Issues

### Command Issues

#### Commands Not Appearing
**Problem**: Slash commands don't show up in Discord
**Solutions**:
1. **Check Bot Permissions**:
   - Ensure bot has "Use Slash Commands" permission
   - Verify bot is properly invited to the server
   
2. **Command Registration Issues**:
   - Commands may take a few minutes to appear after bot invite
   - Try refreshing Discord (Ctrl+R)
   - Check if you have the correct bot permissions

3. **Duplicate Commands**:
   - If you see duplicate commands, contact the administrator
   - This usually happens when commands are registered both globally and to a specific server

#### Command Execution Errors
**Problem**: Commands start but don't complete or show errors

**Error**: "Interaction has already been acknowledged"
**Solution**: 
- Wait a moment and try the command again
- This is a timing issue that usually resolves quickly

**Error**: "Unknown interaction" (DiscordAPIError[10062])
**Solution**:
- This critical bug has been fixed in v1.8.1 with improved timeout management
- The issue was caused by autocomplete taking too long and exceeding Discord's 3-second limit
- Update to the latest bot version - this error should no longer occur
- New lightweight autocomplete provides 80% faster suggestions

**Error**: "Interaction has already been acknowledged" (DiscordAPIError[40060])
**Solution**:
- Fixed in v1.8.1 with enhanced interaction state checking
- The bot now validates interaction state before every response
- Improved error boundaries prevent double-acknowledgment issues
- If you still see this, try the command again after a few seconds

**Error**: "Command failed"
**Solution**:
- Check your internet connection
- Verify the bot is online (should show as online in member list)
- Try a simpler command like `/info` first

### Fighter Command Issues

#### Fighter Not Found
**Problem**: `/fighter` command says fighter not found

**Solutions**:
1. **Use Full Names**: Use complete names like "Alexander Volkanovski" instead of "Alex"
2. **Try Nicknames**: Use fighter nicknames like "Volk" for Alexander Volkanovski
3. **Check Spelling**: Verify the fighter's name spelling exactly as it appears on UFC.com
4. **Use Autocomplete**: Start typing and select from suggestions
5. **Check UFC Roster**: Only active UFC fighters are available (retired fighters may not appear)

**Search Logic** *(Updated January 2025)*:
- **Full Name Match**: "Alexander Volkanovski" → Direct match ✅
- **Nickname Match**: "Volk" → Finds Volkanovski ✅  
- **Partial Match**: "alex" → Shows in autocomplete only ⚠️
- **Case Insensitive**: Works with any capitalization

**Example Working Commands**:
```
/fighter name:Alexander Volkanovski
/fighter name:Volk
/fighter name:Max Holloway
/fighter name:Islam Makhachev
/fighter name:Jon Jones
```

#### Fighter Comparison Failed  *(Resolved January 2025)*
**Problem**: "Could not find detailed information for [fighter names]"

**Previous Issue**: This was caused by static/mock data limitations
**Solution**: Updated to use real-time UFC.com scraping
- Alexander Volkanovski lookups now work perfectly
- All active UFC fighters are accessible
- Data is always current and accurate
- Enhanced search logic prevents false negatives

#### Slow Fighter Command Response
**Problem**: Fighter command takes a long time to respond

**Solutions**:
1. **First UFC.com Lookup**: Initial scraping may take 5-15 seconds
2. **Cached Data**: Subsequent lookups are much faster (30-minute cache)
3. **Timeout Protection**: Command will automatically defer if taking too long
4. **Network Issues**: Check your internet connection
5. **UFC.com Availability**: Rare delays if UFC.com is slow to respond

**Performance** *(Updated January 2025)*:
- Real-time scraping: 5-15 seconds for new fighters
- Cached lookups: Under 1 second
- Automatic caching prevents repeated UFC.com requests

#### Autocomplete Not Working
**Problem**: No suggestions appear when typing fighter names

**Solutions**:
1. **Wait for Loading**: Give autocomplete a moment to load
2. **Type More Letters**: Try typing at least 2-3 characters
3. **Check Connection**: Ensure stable internet connection
4. **Clear and Retry**: Clear the input and try typing again

#### Autocomplete Issues

**Problem**: Autocomplete suggestions not appearing or causing errors

**Solutions**:
1. **v1.8.1 Performance Improvements**:
   - Implemented lightweight autocomplete with 80% faster response times
   - Fixed all DiscordAPIError[10062] and DiscordAPIError[40060] issues
   - Reduced timeout from 2s to 1.5s with optimized search methods
   - Separated autocomplete search from full profile fetching for better performance

2. **If Autocomplete is Slow**:
   - Type at least 2 characters for suggestions to appear
   - New lightweight method provides instant suggestions
   - Fallback to popular fighters shown if UFC.com is temporarily slow

3. **Empty Autocomplete**:
   - Ensure you're typing a valid fighter name
   - Try well-known fighters like "Alexander Volkanovski" or "Conor McGregor"
   - The system now uses optimized lightweight search for better accuracy

#### Fighter Comparison Fails
**Problem**: Fighter comparison doesn't work or shows error

**Solutions**:
1. **Verify Both Fighters**: Ensure both fighter names are valid
2. **Use Autocomplete**: Select both fighters from autocomplete suggestions
3. **Check Format**: Use `/fighter name:Fighter1 compare:Fighter2`

### Fight Command Issues

#### No Upcoming Events
**Problem**: `/fight` shows no upcoming events or old data

**Solutions**:
1. **Use Refresh Button**: Click the 🔄 refresh button
2. **Check Date**: Verify current date and time
3. **UFC Schedule**: There may genuinely be no events scheduled soon

#### Missing Event Information
**Problem**: Event shows but missing details

**Solutions**:
1. **Refresh Data**: Use the refresh button
2. **Check Different Sections**: Use buttons to explore different parts
3. **Wait for Updates**: Information may be updated closer to event date

## 🛠️ Administrator Issues

### Bot Setup Problems

#### Bot Not Responding
**Problem**: Bot appears online but doesn't respond to commands

**Diagnostic Steps**:
1. **Check Permissions**:
   ```
   Required permissions:
   - Send Messages
   - Use Slash Commands  
   - Embed Links
   - Read Message History
   ```

2. **Verify Bot Configuration**:
   - Ensure bot token is valid
   - Check client ID is correct
   - Verify guild ID if using guild-specific commands

3. **Command Registration**:
   - Commands may need to be deployed
   - Check deployment logs for errors

#### Deployment Issues
**Problem**: Bot deployment fails or doesn't work after deployment

**Solutions**:
1. **Environment Variables**: Verify all required environment variables are set
2. **Command Deployment**: Ensure commands are properly deployed
3. **Check Logs**: Review deployment platform logs for errors

**Required Environment Variables**:
```
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here (optional for global deployment)
NODE_ENV=production
```

### Performance Issues

#### Slow Response Times
**Problem**: Commands take a long time to respond

**Solutions**:
1. **Check Server Resources**: Verify deployment platform resources
2. **Network Issues**: Check connectivity to Discord API
3. **Cache Performance**: Some responses may be slower on first use

#### Memory or Resource Issues
**Problem**: Bot uses too much memory or CPU

**Solutions**:
1. **Restart Bot**: Simple restart often resolves memory leaks
2. **Check Logs**: Look for error patterns or excessive requests
3. **Monitor Usage**: Track resource usage over time

## 🔍 Diagnostic Tools

### Built-in Diagnostics
Use these commands to check bot health:

```bash
# Check command registration
npm run deploy:diagnose

# Test functionality  
npm run test:production

# Check version
npm run docs:version
```

### Manual Testing
Test basic functionality:

1. **Test `/info`**: Should respond quickly with bot information
2. **Test `/fight`**: Should show upcoming UFC event
3. **Test `/fighter`**: Try with a common name like "Jon Jones"

### Log Analysis
Check these log patterns:

**Good Signs**:
- "Ready! Logged in as FightBot#xxxx"
- "Successfully reloaded X application (/) commands"
- Command executions without errors

**Warning Signs**:
- "DiscordAPIError" messages
- "Interaction timeout" warnings
- "Failed to send" errors

## 📞 Getting Help

### Self-Service Options
1. **Use `/info`**: Get current bot status and features
2. **Try Basic Commands**: Start with simple commands to isolate issues
3. **Check This Guide**: Review relevant sections above

### Escalation Steps
1. **Document the Issue**: Note exact command, error message, and timing
2. **Check Consistency**: Verify if issue happens consistently or sporadically
3. **Gather Context**: Include server size, permissions, recent changes

### Common Fixes Summary
- **Restart Discord**: Ctrl+R or restart the app
- **Wait and Retry**: Many timing issues resolve themselves
- **Check Permissions**: Ensure bot has proper permissions
- **Use Autocomplete**: Reduces typing errors
- **Try `/info` First**: Verifies basic bot functionality

---

## 🎯 Prevention Tips

### For Users
- Use autocomplete features to avoid typos
- Wait for commands to complete before trying again
- Use interactive buttons for additional information

### For Administrators  
- Regularly check bot status and logs
- Keep environment variables secure and up-to-date
- Monitor resource usage on deployment platform
- Test major features after any updates

---

**Most issues resolve quickly with a simple retry!** 🔄

If problems persist, the bot includes comprehensive error handling and will usually provide helpful error messages to guide you toward a solution.
