# FightBot Setup Guide

This guide will help you set up FightBot using the new modular architecture.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Discord Bot Token (see [Discord Developer Portal](https://discord.com/developers/applications))

## Setup Steps

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/Fightbot.git
cd Fightbot
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Copy the example environment file and add your Discord bot token:

```bash
cp src/.env.example src/.env
```

Edit the `src/.env` file and add your Discord bot token and other required values.

4. **Deploy commands to Discord**

```bash
# For development with instant updates to a single server:
npm run deploy:dev

# For production with global command registration:
npm run deploy
```

5. **Start the bot**

```bash
# For development:
npm run dev

# For production:
npm start
```

## Development Workflow

### Directory Structure

The new architecture follows this structure:

- `src/` - Main source code
  - `commands/` - Command implementations
    - `core/` - Core commands (help, info)
    - `ufc/` - UFC-related commands (fight, fighter, odds)
    - `user/` - User-related commands (preferences)
    - `admin/` - Admin-only commands
  - `services/` - Service implementations
  - `events/` - Discord.js event handlers
  - `config/` - Configuration files
  - `utils/` - Utility functions
  - `core/` - Core application components

### Creating a New Command

To create a new command:

1. Create a new JavaScript file in the appropriate directory under `src/commands/`
2. Extend the `BaseCommand` class
3. Implement the required methods

Example:

```javascript
import BaseCommand from '../baseCommand.js';

class MyNewCommand extends BaseCommand {
    constructor() {
        super();
        
        // Configure the command
        this.builder
            .setName('mycommand')
            .setDescription('My new command description');
    }
    
    async execute(interaction) {
        try {
            // Track command usage
            await this.trackCommandUsage('mycommand');
            
            // Command implementation
            await interaction.reply('Hello from my new command!');
        } catch (error) {
            await this.handleError(interaction, error);
        }
    }
}

export default new MyNewCommand();
```

### Creating a New Service

To create a new service:

1. Create a new JavaScript file in `src/services/`
2. Extend the `BaseService` class
3. Register the service in `src/services/serviceRegistry.js`

Example:

```javascript
import BaseService from './baseService.js';

class MyNewService extends BaseService {
    constructor() {
        super();
    }
    
    async init() {
        try {
            // Initialize your service
            await super.init();
        } catch (error) {
            this.handleError(error, 'init');
        }
    }
    
    // Service methods
    async doSomething() {
        // Implementation
    }
}

export default MyNewService;
```

## Troubleshooting

### Common Issues

- **Import errors**: Ensure you're using the correct path format for ESM imports. On Windows, you may need to use file:// URLs for dynamic imports.
- **Command not registering**: Check that your command class is properly exported and registered in the command registry.
- **Service not found**: Make sure your service is registered in the serviceRegistry.js file.

### Getting Help

If you encounter issues, check the logs for detailed error messages. If you need additional assistance, please create an issue on GitHub.
