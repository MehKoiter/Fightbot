/**
 * FightBot - Discord Bot for UFC information
 * Entry point redirecting to src/index.js
 */

console.log('🤖 Starting FightBot...');

// Import the main file from src
import('./src/index.js').catch(err => {
    console.error('❌ Failed to start FightBot:', err);
    process.exit(1);
});

// Set the clients commands to an empty list.
// New commands will be added later.
client.commands = new Collection();

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
    console.log('🤖 Starting Fightbot...');
    
    // Load commands and events
    await loadCommands();
    await loadEvents();
    
    // Tells the client to login to discord given its token.
    try {
        await client.login(token);
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

// Start the bot
initialize();