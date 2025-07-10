# SportsData.io API Integration Setup Guide

## Overview
This guide will help you integrate the SportsData.io MMA API into your Fightbot project for more reliable and comprehensive fighter data.

## Benefits of SportsData.io Integration
- **Professional API**: Structured, reliable data from a professional sports data provider
- **Comprehensive Coverage**: UFC events, fighters, fights, and betting odds
- **Real-time Updates**: Live fight results and up-to-date fighter information
- **Better Performance**: Faster response times compared to web scraping
- **Reduced Maintenance**: No need to handle website structure changes

## Getting Started

### Step 1: Sign Up for SportsData.io
1. Visit [SportsData.io](https://sportsdata.io/)
2. Create an account
3. Choose the **MMA package** for UFC data access
4. Note: They offer a free tier with limited requests for testing

### Step 2: Get Your API Key
1. After signing up, go to your dashboard
2. Navigate to "API Keys" section
3. Copy your MMA API key

### Step 3: Configure Your Environment
1. Open your `.env` file
2. Replace `your_api_key_here` with your actual API key:
   ```
   SPORTSDATA_API_KEY=your_actual_api_key_here
   ```

### Step 4: Test the Integration
Run the test script to verify everything is working:
```bash
node test-sportsdata-api.js
```

## Available Services

### SportsDataMMAService
Main service for interacting with the SportsData.io API:
- `searchFighter(name)` - Search for fighters by name
- `getFighterDetails(fighterId)` - Get detailed fighter information
- `getUpcomingEvents()` - Get upcoming UFC events
- `getRecentEvents()` - Get recent UFC events
- `getFightDetails(fightId)` - Get detailed fight information
- `getEventFights(eventId)` - Get all fights for an event

### HybridFighterService
Combines SportsData.io API with existing UFC scraping for best results:
- Uses SportsData.io as primary source
- Falls back to UFC scraping when needed
- Provides comprehensive fighter profiles

## API Endpoints Used

### Fighters
- `GET /v3/mma/scores/json/Fighters` - All fighters
- `GET /v3/mma/scores/json/Fighter/{fighterid}` - Fighter details

### Events
- `GET /v3/mma/scores/json/Schedule/{season}` - Event schedule
- `GET /v3/mma/scores/json/Event/{eventid}` - Event details

### Fights
- `GET /v3/mma/scores/json/Fight/{fightid}` - Fight details
- `GET /v3/mma/scores/json/FightsByEvent/{eventid}` - Event fights

## Rate Limiting
- Free tier: Limited requests per month
- Paid tiers: Higher rate limits
- The service includes automatic rate limiting to prevent API abuse

## Error Handling
The service includes comprehensive error handling for:
- Invalid API keys (401 errors)
- Rate limit exceeded (429 errors)
- Network timeouts
- Invalid data responses

## Data Quality
SportsData.io provides:
- ✅ Accurate fighter records
- ✅ Up-to-date event schedules
- ✅ Detailed fight statistics
- ✅ Historical data
- ✅ Betting odds (premium feature)

## Troubleshooting

### Common Issues

**API Key Error (401)**
- Verify your API key is correct
- Check that your subscription includes MMA data
- Ensure the key is properly set in your .env file

**Rate Limit Error (429)**
- You've exceeded your API rate limit
- Wait for the rate limit to reset
- Consider upgrading your plan for higher limits

**No Data Found**
- Fighter names must be exact or close matches
- Try different name variations
- Some fighters may not be in the database yet

### Testing Commands
```bash
# Test the API integration
node test-sportsdata-api.js

# Test a specific fighter search
node -e "const service = require('./services/sportsDataMMAService'); new service().searchFighter('Jon Jones').then(console.log)"

# Test upcoming events
node -e "const service = require('./services/sportsDataMMAService'); new service().getUpcomingEvents().then(console.log)"
```

## Migration Strategy
The integration is designed to work alongside your existing services:

1. **Phase 1**: Use SportsData.io for fighter searches (current)
2. **Phase 2**: Migrate event data to SportsData.io
3. **Phase 3**: Use SportsData.io as primary source with UFC scraping as fallback
4. **Phase 4**: Implement real-time fight updates

## Cost Considerations
- **Free Tier**: Good for testing and small bots
- **Paid Tiers**: Required for production bots with high usage
- Monitor your API usage through the SportsData.io dashboard

## Support
- SportsData.io Documentation: https://sportsdata.io/developers/api-documentation/mma
- Data Dictionary: https://sportsdata.io/developers/data-dictionary/mma
- Support: Contact SportsData.io support for API issues
