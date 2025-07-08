# Fightbot
![alt text](https://github.com/MehKoiter/Fightbot/blob/Adding-Axios/img/mmaGloveSmall.png?raw=true)

A Discord bot for UFC fight information and updates.

## Features
- Get information about upcoming UFC events
- Slash command support
- Modular command and event system

## Setup

### Prerequisites
- Node.js 16.9.0 or higher
- Discord application with bot token

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment variables template:
   ```bash
   copy .env.example .env
   ```

4. Fill in your Discord bot credentials in `.env`:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   GUILD_ID=your_guild_id_here (optional, for guild-specific commands)
   ```

5. Deploy slash commands:
   ```bash
   npm run deploy
   ```

6. Start the bot:
   ```bash
   npm start
   ```

### Development
For development with auto-restart on file changes:
```bash
npm run dev
```

## Commands
- `/fight` - Currently displays the URL to the UFC events page
  - Future implementation: Shows list of events and main card fights for upcoming events

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Security
- Never commit your `.env` file
- Keep your Discord bot token secure
- Regularly rotate your bot token if compromised