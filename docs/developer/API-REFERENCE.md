# 🔧 FightBot Developer API Reference

Technical reference for FightBot's internal architecture and APIs.

## 📋 Table of Contents
- [Core Services](#core-services)
- [Command Architecture](#command-architecture)
- [Event Handling](#event-handling)
- [Data Models](#data-models)
- [Configuration](#configuration)
- [Testing Framework](#testing-framework)

## 🔧 Core Services

### UfcService
**File**: `services/ufcService.js`
**Purpose**: Fetches UFC event and fight data

```javascript
class UfcService {
    async getUpcomingEvent()        // Get next UFC event
    async getFightCard(eventId)     // Get complete fight card
    async getFighterRankings()      // Get current UFC rankings
}
```

**Usage Example**:
```javascript
import UfcService from './services/ufcService.js';

const ufcService = new UfcService();
const event = await ufcService.getUpcomingEvent();
```

### FighterService *(Phase 7)*
**File**: `services/fighterService.js`
**Purpose**: Advanced fighter data management and analysis

```javascript
class FighterService {
    async getFighterProfile(name)           // Get detailed fighter profile
    async searchFighter(query)              // Search for fighters
    async compareFighters(fighter1, fighter2) // Compare two fighters
    async getFighterStats(fighterId)        // Get performance statistics
    async predictFightOutcome(f1, f2)       // AI fight prediction
}
```

**Caching**: Built-in 30-minute cache for improved performance

### FighterInteractionHandler
**File**: `services/fighterInteractionHandler.js`
**Purpose**: Handle fighter-related button interactions

```javascript
class FighterInteractionHandler {
    async handleDetailedStats(interaction, fighterName)
    async handleFightHighlights(interaction, fighterName)
    async handleComparison(interaction, fighterName)
    async handlePrediction(interaction, fighterName)
    async handleFightingStyles(interaction, fighterName)
}
```

### EventCache
**File**: `services/eventCache.js`
**Purpose**: Intelligent caching system for event data

```javascript
const eventCache = {
    get(key, userId, channelId)     // Get cached data
    set(key, data, userId, channelId) // Set cached data
    invalidate(key)                 // Clear specific cache
    cleanup()                       // Remove expired entries
}
```

## 🎮 Command Architecture

### Command Structure
All commands follow this standardized structure:

```javascript
export default {
    data: SlashCommandBuilder,      // Discord slash command definition
    execute: async (interaction),   // Main command execution
    autocomplete: async (interaction) // Optional autocomplete handler
}
```

### Command Registration
Commands are automatically discovered and registered from `/commands` directory:

```javascript
// deploy-commands.js automatically loads:
commands/
├── fight.js      // UFC event command
├── fighter.js    // Fighter profiles (Phase 7)
├── info.js       // Bot information
└── donate.js     // Support command
```

### Interaction Handling Best Practices

**Safe Defer Pattern**:
```javascript
const safeDeferReply = async () => {
    if (!hasDeferred && !interaction.replied && !interaction.deferred) {
        try {
            await interaction.deferReply();
            hasDeferred = true;
        } catch (error) {
            console.error('Failed to defer reply:', error);
            throw error;
        }
    }
};
```

**Hybrid Response Pattern**:
```javascript
// Try fast response first, defer if needed
try {
    const result = await Promise.race([
        fastOperation(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2500))
    ]);
    await interaction.reply(result);
} catch (timeoutError) {
    await safeDeferReply();
    const result = await slowOperation();
    await interaction.editReply(result);
}
```

## 📡 Event Handling

### InteractionCreate Event
**File**: `events/interactionCreate.js`
**Purpose**: Route and handle all Discord interactions

**Features**:
- Command execution with timeout protection
- Autocomplete handling
- Button interaction routing
- Error recovery and user feedback

**Timeout Protection**:
```javascript
// Emergency defer at 2.5 seconds
setTimeout(async () => {
    if (!interaction.replied && !interaction.deferred) {
        await interaction.deferReply();
    }
}, 2500);
```

### Button Interaction Routing
```javascript
// Button interactions are routed based on customId patterns:
fighter_detailed_stats_${fighterName}
fighter_highlights_${fighterName}
fighter_compare_${fighterName}
fighter_prediction_${fighterName}
fighter_styles_${fighterName}
```

## 📊 Data Models

### Fight Event Model
```javascript
{
    title: string,           // Event title
    date: Date,              // Event date
    venue: string,           // Venue name
    location: string,        // City, State/Country
    mainCard: Fight[],       // Main card fights
    prelims: Fight[],        // Preliminary fights
    broadcastInfo: object    // TV/streaming info
}
```

### Fight Model
```javascript
{
    fighter1: Fighter,       // Red corner fighter
    fighter2: Fighter,       // Blue corner fighter
    weightClass: string,     // Weight division
    rounds: number,          // Scheduled rounds
    titleFight: boolean,     // Championship fight flag
    coMain: boolean          // Co-main event flag
}
```

### Fighter Model *(Phase 7)*
```javascript
{
    name: string,            // Fighter name
    nickname: string,        // Fighter nickname
    record: {
        wins: number,
        losses: number,
        draws: number,
        winsByKO: number,
        winsBySubmission: number,
        winsByDecision: number
    },
    physicalStats: {
        height: string,
        weight: string,
        reach: string,
        stance: string
    },
    rankings: object,        // Current rankings
    socialMedia: object      // Social media links
}
```

## ⚙️ Configuration

### Version Configuration
**File**: `config/version.js`

```javascript
export const VERSION_CONFIG = {
    version: '1.7.2-free',
    edition: 'free',
    releaseDate: '2025-07-09',
    features: {
        fightCards: true,
        fighterProfiles: true,    // Phase 7
        fighterComparison: true,  // Phase 7
        fightPredictions: true,   // Phase 7
        allFeaturesAreFree: true
    }
};
```

### Environment Variables
```env
# Required
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here

# Optional
GUILD_ID=your_guild_id_here    # For guild-specific commands
NODE_ENV=production            # Environment setting
```

## 🧪 Testing Framework

### Test Categories
```
tests/
├── unit/           # Individual component tests
├── integration/    # Component interaction tests
├── performance/    # Timing and optimization tests
└── archived/       # Legacy tests
```

### Test Runner
```bash
# Run all tests
npm run test

# Run by category
npm run test:unit
npm run test:integration
npm run test:performance

# Run specific tests
npm run test:fighter-timing
npm run test:autocomplete-timing
```

### Test Utilities
**File**: `test-runner.js`
- Automated test discovery
- Category-based execution
- Performance timing
- Comprehensive reporting

## 🔄 Deployment Pipeline

### Command Deployment
```bash
# Deploy to guild (instant)
npm run deploy

# Deploy globally (1 hour propagation)
npm run deploy:global

# Diagnose command issues
npm run deploy:diagnose

# Clean duplicate commands
npm run deploy:cleanup
```

### Health Monitoring
Built-in health check server for deployment platforms:
- Endpoint: `/health`
- Returns bot status, uptime, and version
- Satisfies platform port binding requirements

## 🛡️ Error Handling

### Interaction Error Patterns
**DiscordAPIError[10062]**: Unknown interaction
- **Cause**: Interaction token expired
- **Solution**: Hybrid timing approach with timeout protection

**DiscordAPIError[40060]**: Interaction already acknowledged
- **Cause**: Multiple responses to same interaction
- **Solution**: Interaction state validation before responding

### Recovery Strategies
1. **Graceful Degradation**: Provide partial functionality when possible
2. **User Feedback**: Clear error messages with suggested actions
3. **Automatic Retry**: Built-in retry logic for transient failures
4. **Logging**: Comprehensive error logging for debugging

## 📚 Code Style Guidelines

### Import Organization
```javascript
// External dependencies first
import { SlashCommandBuilder } from 'discord.js';

// Internal services
import UfcService from '../services/ufcService.js';
import FighterService from '../services/fighterService.js';

// Configuration
import { VERSION_CONFIG } from '../config/version.js';
```

### Error Handling Pattern
```javascript
try {
    // Main operation
    const result = await operation();
    await interaction.reply({ embeds: [result] });
} catch (error) {
    console.error('Operation failed:', error);
    
    try {
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ 
                content: 'Error message',
                ephemeral: true 
            });
        }
    } catch (replyError) {
        console.error('Failed to send error response:', replyError);
    }
}
```

### Embed Creation Pattern
```javascript
const embed = new EmbedBuilder()
    .setColor('#ff0000')                    // UFC red
    .setTitle('🥊 Title')
    .setDescription('Description')
    .addFields([
        { name: 'Field Name', value: 'Field Value', inline: false }
    ])
    .setTimestamp()
    .setFooter({ text: 'FightBot Free' });
```

---

## 🔗 Quick Reference Links

- **[Testing Guide](TESTING.md)** - Comprehensive testing documentation
- **[Documentation Workflow](DOCUMENTATION-WORKFLOW.md)** - Documentation standards
- **[Phase 7 Features](../features/PHASE7.md)** - Advanced fighter features
- **[Deployment Guide](../deployment/DEPLOYMENT.md)** - Production deployment

---

**This API reference is maintained alongside code changes to ensure accuracy.** 📚✨
