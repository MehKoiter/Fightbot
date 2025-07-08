// GatewayIntentBits is the language used for discord.js to know what things to monitor
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { token } from './config.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import UserDatabaseService from './services/userDatabaseService.js';
import { VERSION_CONFIG } from './config/version.js';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Creates a new client object and sets up its list of discord bot intents.
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessageTyping,
    ]
})

// Set the clients commands to an empty list.
// New commands will be added later.
client.commands = new Collection();

// Initialize database service
let userDB;

/**
 * Dynamically loads command files from the commands directory
 */
async function loadCommands() {
    try {
        // Gets the individual command files from the command directory. 
        const commandsPath = path.join(__dirname, 'commands');
        // Filters out all of the non .js files from the directory so we are left with only Javascript command files.
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        // For each file in the commands directory 
        for (const file of commandFiles) {
            try {
                const command = (await import(`./commands/${file}`)).default;
                if (command?.data?.name) {
                    client.commands.set(command.data.name, command);
                    console.log(`✅ Loaded command: ${command.data.name}`);
                } else {
                    console.warn(`⚠️  Command file ${file} is missing required data or name property`);
                }
            } catch (error) {
                console.error(`❌ Failed to load command ${file}:`, error.message);
            }
        }
    } catch (error) {
        console.error('❌ Failed to load commands directory:', error.message);
        process.exit(1);
    }
}

/**
 * Dynamically loads event files from the events directory
 */
async function loadEvents() {
    try {
        // Gets the individual event files from the events directory. 
        const eventsPath = path.join(__dirname, 'events');
        // Filters out all of the non .js files from the directory so we are left with only Javascript event files.
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

        // For each file in the events directory, set them to the clients commands.
        for (const file of eventFiles) {
            try {
                const discordEvent = (await import(`./events/${file}`)).default;
                if (discordEvent?.name) {
                    if (discordEvent.once) {
                        client.once(discordEvent.name, (...args) => discordEvent.execute(...args));
                    } else {
                        client.on(discordEvent.name, (...args) => discordEvent.execute(...args));
                    }
                    console.log(`✅ Loaded event: ${discordEvent.name}`);
                } else {
                    console.warn(`⚠️  Event file ${file} is missing required name property`);
                }
            } catch (error) {
                console.error(`❌ Failed to load event ${file}:`, error.message);
            }
        }
    } catch (error) {
        console.error('❌ Failed to load events directory:', error.message);
        process.exit(1);
    }
}

/**
 * Initialize the Discord bot
 */
async function initialize() {
    console.log(`🤖 Starting FightBot ${VERSION_CONFIG.version} (All Features FREE!)...`);
    
    // Initialize user database
    userDB = new UserDatabaseService();
    await userDB.initialize();
    console.log('✅ User database initialized');
    
    // Load commands and events
    await loadCommands();
    await loadEvents();

    // Tells the client to login to discord given its token.
    try {
        await client.login(token);
        
        console.log(`✅ FightBot initialized successfully! All features are FREE! 🎉`);
        
        // Start background services
        startBackgroundServices();
    } catch (error) {
        console.error('❌ Failed to login to Discord:', error.message);
        process.exit(1);
    }
}

// Error handling for uncaught exceptions
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});

/**
 * Start background services and tasks
 */
function startBackgroundServices() {
    console.log('🌟 Starting background services...');
    
    // Check for event reminders every hour
    setInterval(checkEventReminders, 60 * 60 * 1000);
    
    // Check for odds changes every 15 minutes (if odds service is available)
    setInterval(checkOddsChanges, 15 * 60 * 1000);
    
    console.log('✅ Background services started');
}

/**
 * Check for upcoming events and send reminders
 */
async function checkEventReminders() {
    try {
        // This would check for events starting soon and send reminders
        console.log('📅 Checking for event reminders...');
        // Implementation would go here
    } catch (error) {
        console.error('Error checking event reminders:', error);
    }
}

/**
 * Check for significant odds changes
 */
async function checkOddsChanges() {
    try {
        // This would monitor odds changes and notify users
        console.log('💰 Checking for odds changes...');
        // Implementation would go here
    } catch (error) {
        console.error('Error checking odds changes:', error);
    }
}

// Start the bot
initialize();