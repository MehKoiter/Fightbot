# FightBot Architecture

## New Architecture Overview

The FightBot codebase has been refactored to a more modular, maintainable architecture using modern JavaScript patterns, dependency injection, and service-oriented design. This document outlines the new structure and the migration process.

## Migration Status (July 8, 2025)

- ✅ Created base directory structure and framework
- ✅ Implemented serviceContainer, baseService, and baseCommand
- ✅ Migrated core services (configService, eventCacheService, fightParserService)
- ✅ Migrated core commands (help, info, fight)
- ✅ Set up command registry and deployment scripts
- ✅ Created new event handlers
- ✅ Updated package.json with new scripts
- ✅ Migrated UFC commands (fight, fighter, odds)
- ✅ Migrated user commands (preferences)
- ✅ Migrated admin commands (admin)
- ✅ Added path utilities for ESM imports on Windows
- ✅ Added centralized error handling and logging
- ✅ Created version.js config and environment setup
- ✅ Added .env.example template for configuration
- 🔄 Testing and validating the new architecture
- 🔄 Fixing import path issues for ESM modules
- ⬜ Complete testing and validation
- ⬜ Remove legacy code

### Directory Structure

```
fightbot/
├── src/                   # New modular architecture
│   ├── commands/          # Command implementations
│   ├── config/            # Configuration files
│   ├── core/              # Core application classes
│   ├── events/            # Event handlers
│   ├── services/          # Service implementations
│   │   ├── baseService.js       # Base service class
│   │   └── serviceContainer.js  # Dependency injection container
│   └── utils/             # Utility functions and helpers
├── commands/              # Legacy command implementations
├── events/                # Legacy event handlers
├── services/              # Legacy service implementations
├── config.js              # Legacy configuration
├── index.js               # Legacy entry point
└── package.json           # Project metadata and dependencies
```

### Key Components

1. **Service Container**: A dependency injection container that manages service instances and their lifecycles.
2. **Base Service**: A base class for all services with common functionality like initialization and error handling.
3. **Base Command**: A base class for all commands with standardized structure and analytics tracking.
4. **Logger**: A utility for consistent logging across the application.
5. **FightBot Application**: A main application class that brings everything together.

### Migration Process

The migration to the new architecture will be done gradually, with the following steps:

1. **Set up the new architecture framework**:
   - Create base classes and utilities
   - Set up dependency injection
   - Create a new entry point

2. **Migrate commands and services**:
   - Create new versions of existing commands using the new base classes
   - Create new versions of existing services using the new base class
   - Register services with the container

3. **Migrate event handlers**:
   - Create new event handlers that use the new services and commands
   - Ensure backward compatibility with existing code

4. **Update main application**:
   - Update the entry point to use the new architecture
   - Ensure both old and new code can run side by side

5. **Gradually move business logic**:
   - Gradually move business logic from legacy files to the new structure
   - Remove legacy code once it's fully migrated

### Usage

To run the bot with the new architecture, use:

```bash
npm run start:new
```

To run in development mode with auto-restart on file changes:

```bash
npm run dev:new
```

### Benefits of the New Architecture

- **Modularity**: Clean separation of concerns with a well-defined directory structure
- **Dependency Injection**: Services are registered and accessed through a container, making them easier to manage and test
- **Standardization**: Base classes ensure consistent implementation patterns
- **Error Handling**: Centralized error handling for better reliability
- **Logging**: Consistent logging throughout the application
- **Testability**: The modular design makes unit testing easier
- **Scalability**: Easy to add new features and components

### Known Issues and To-Do Items

- Fix ESM import paths for Windows compatibility (URLs with `file://` protocol)
- Update logger usage consistency across services
- Fix path resolution in commandRegistry.js for module imports
- Complete error handling in UfcService and EventCacheService
- Ensure all services are properly registered and initialized

## Future Enhancements

- Add unit tests
- Implement a database abstraction layer
- Add a plugin system for extensions
- Create a more robust configuration system
- Add more comprehensive logging and monitoring
- Improve error handling and reporting
- Add more detailed documentation for each component
