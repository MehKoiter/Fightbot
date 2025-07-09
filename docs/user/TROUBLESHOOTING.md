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

**Error**: "Unknown interaction"
**Solution**:
- The command took too long to process
- Try again - the bot has timeout protection

**Error**: "Command failed"
**Solution**:
- Check your internet connection
- Verify the bot is online (should show as online in member list)
- Try a simpler command like `/info` first

### Fighter Command Issues

#### Fighter Not Found
**Problem**: `/fighter` command says fighter not found

**Solutions**:
1. **Check Spelling**: Verify the fighter's name spelling
2. **Use Autocomplete**: Start typing and select from suggestions
3. **Try Full Names**: Use complete names like "Jon Jones" instead of "Jones"
4. **Use Nicknames**: Try fighter nicknames like "Bones" for Jon Jones
5. **Supported Fighters**: Current database includes:
   - Jon Jones ("Bones")
   - Israel Adesanya ("The Last Stylebender", "Izzy")
   - More fighters being added regularly

**Example Working Commands**:
```
/fighter name:Jon Jones
/fighter name:Bones
/fighter name:Israel Adesanya
/fighter name:Stylebender
```

#### Fighter Comparison Failed  *(Fixed as of July 9, 2025)*
**Problem**: "Could not find detailed information for [fighter names]"

**Previous Issue**: This was caused by unreliable data sources
**Solution**: Updated to use reliable UFC Stats database
- Jon Jones vs Israel Adesanya comparisons now work perfectly
- All fighter data is accurate and up-to-date
- Faster response times with local data caching

#### Slow Fighter Command Response
**Problem**: Fighter command takes a long time to respond

**Solutions**:
1. **First Use**: Initial lookup may take a few seconds
2. **Cached Data**: Subsequent lookups are much faster (30-minute cache)
3. **Timeout Protection**: Command will automatically defer if taking too long
4. **Network Issues**: Check your internet connection
2. **Use Full Name**: Try "Jon Jones" instead of just "Jon"
3. **Use Autocomplete**: Start typing and select from suggestions
4. **Try Variations**: Some fighters may be listed under different names

**Common Name Variations**:
- Jon Jones (not Jonathan Jones)
- Conor McGregor (not Connor)
- Islam Makhachev (not Makhachov)

#### Autocomplete Not Working
**Problem**: No suggestions appear when typing fighter names

**Solutions**:
1. **Wait for Loading**: Give autocomplete a moment to load
2. **Type More Letters**: Try typing at least 2-3 characters
3. **Check Connection**: Ensure stable internet connection
4. **Clear and Retry**: Clear the input and try typing again

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
