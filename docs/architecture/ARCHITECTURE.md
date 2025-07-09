# 🏗️ FightBot Architecture

This document describes the overall architecture and design patterns used in FightBot.

## Project Structure

```
fightbot/
├── commands/           # Slash command implementations
│   ├── fight.js       # Fight card commands
│   ├── fighter.js     # Fighter profile commands
│   └── info.js        # Bot information commands
├── events/             # Discord event handlers
│   ├── interactionCreate.js  # Command and button interactions
│   └── ready.js       # Bot startup event
├── services/           # Business logic and external APIs
│   ├── fightParser.js         # Fight data parsing
│   ├── interactionHandler.js  # Interaction management
│   └── ufcService.js          # UFC API integration
├── tests/             # Test suites
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   └── performance/   # Performance tests
├── docs/              # Documentation
├── img/               # Static assets
├── config.js          # Configuration management
├── index.js           # Application entry point
└── deploy-commands.js # Command deployment script
```

## Core Components

### 1. Command System (`commands/`)

**Pattern**: Command Factory
- Each command is a separate module
- Implements standardized structure with `data` and `execute` functions
- Uses Discord.js SlashCommandBuilder for command definitions

```javascript
// Command structure
export const data = new SlashCommandBuilder()
    .setName('command-name')
    .setDescription('Command description');

export async function execute(interaction) {
    // Command logic
}
```

### 2. Event System (`events/`)

**Pattern**: Event-Driven Architecture
- Modular event handlers
- Centralized interaction processing
- Separation of concerns between events and business logic

### 3. Service Layer (`services/`)

**Pattern**: Service Layer Pattern
- Business logic abstraction
- External API integration
- Data transformation and validation
- Reusable service components

#### Service Responsibilities:
- **`ufcService.js`**: UFC API integration and data fetching
- **`fightParser.js`**: Data parsing and transformation
- **`interactionHandler.js`**: Discord interaction management

### 4. Configuration (`config.js`)

**Pattern**: Configuration Object
- Centralized configuration management
- Environment variable validation
- Runtime configuration validation

## Design Patterns

### 1. Command Pattern
Commands are implemented as separate objects with standardized interfaces:
- Encapsulates command logic
- Enables easy testing and maintenance
- Supports dynamic command loading

### 2. Factory Pattern
Used for creating Discord embeds and components:
- Consistent embed formatting
- Reusable component creation
- Centralized styling

### 3. Strategy Pattern
Multiple strategies for handling different interaction types:
- Command interactions
- Button interactions
- Autocomplete interactions

### 4. Observer Pattern
Event-driven architecture with Discord.js:
- Bot events trigger appropriate handlers
- Loose coupling between components
- Extensible event system

## Data Flow

```
Discord Interaction
        ↓
Event Handler (interactionCreate.js)
        ↓
Interaction Router
        ↓
Command/Button Handler
        ↓
Service Layer (UFC API, Parser)
        ↓
Response Generation
        ↓
Discord Response
```

## Interaction Management

### State Management
- Stateless design for scalability
- Interaction-scoped data only
- No persistent state between interactions

### Error Handling
- Graceful degradation
- User-friendly error messages
- Comprehensive logging
- Interaction acknowledgment management

### Timeout Protection
- Autocomplete timeout guards
- Interaction expiration handling
- Safe defer/reply patterns

## Testing Architecture

### Test Structure
```
tests/
├── unit/              # Component-level tests
├── integration/       # Service integration tests
├── performance/       # Load and performance tests
└── archived/          # Historical test files
```

### Testing Patterns
- **Unit Tests**: Individual function testing
- **Integration Tests**: Service and API integration
- **Mock Services**: External API mocking
- **Test Runners**: Automated test execution

## Security Considerations

### Input Validation
- Discord interaction validation
- Parameter sanitization
- SQL injection prevention (if applicable)

### Rate Limiting
- Discord API rate limit handling
- UFC API rate limit management
- User interaction throttling

### Error Information
- Sanitized error responses
- No sensitive data in logs
- Graceful failure handling

## Scalability Design

### Stateless Architecture
- No server-side sessions
- Horizontal scaling ready
- Database-free operation

### Caching Strategy
- In-memory caching for fight data
- TTL-based cache expiration
- Cache invalidation patterns

### Performance Optimization
- Efficient API calls
- Minimized Discord API requests
- Optimized embed generation

## Extension Points

### Adding New Commands
1. Create command file in `commands/`
2. Implement required structure
3. Register in deployment script
4. Add tests and documentation

### Adding New Services
1. Create service in `services/`
2. Implement service interface
3. Add error handling
4. Write integration tests

### Event Handlers
1. Create handler in `events/`
2. Register with Discord client
3. Implement error handling
4. Add monitoring/logging

## Monitoring and Logging

### Log Levels
- **Error**: Critical failures
- **Warn**: Recoverable issues
- **Info**: General information
- **Debug**: Detailed debugging

### Metrics
- Command usage statistics
- Response times
- Error rates
- API call patterns

## See Also

- [API Reference](../developer/API-REFERENCE.md) - Code implementation details
- [Testing Guide](../developer/TESTING.md) - Testing strategies and patterns
- [Deployment Guide](../deployment/DEPLOYMENT.md) - Production architecture
- [Configuration Guide](../configuration/CONFIGURATION.md) - Configuration architecture
