// GatewayIntentBits is the language used for discord.js to know what things to monitor
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { token } from './config.js';
import fs from 'node:fs';
import path from'node:path';

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

// Gets the individual command files from the command directory. 
const commandsPath = path.join('./commands');
// Filters out all of the non .js files from the directory so we are left with only Javascript command files.
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// For each file in the commands directory 
for ( let file of commandFiles ) {
    const command = (await import(`./commands/${file}`) ).default;
    client.commands.set(command.data.name, command);
}

// Gets the individual event files from the events directory. 
const eventsPath = path.join('./events');
// Filters out all of the non .js files from the directory so we are left with only Javascript event files.
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

// For each file in the events directory, set them to the clients commands.
for (let file of eventFiles) {
    const discordEvent = (await import(`./events/${file}`)).default;
    if (discordEvent.once) {
        client.once(discordEvent.name, (...args) => discordEvent.execute(...args));
    } else {
        client.on(discordEvent.name, (...args) => discordEvent.execute(...args));
    }
}

// Tells the client to login to discord given its token.
client.login(token);