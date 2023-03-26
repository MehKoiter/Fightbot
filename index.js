// import fetchEvents from './fetchEvents.js';
// setting requirements for index.js to run
// GatewauIntentBits is the language used for discord.js to know what things to monitor

import { Client, Collection, GatewayIntentBits, ActivityType } from 'discord.js';
import { token } from './config.js';
import interactionHandler from './services/interactionHandler.js';
import fs from 'node:fs';
import path from'node:path';


    const handler = new interactionHandler();


    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.DirectMessageTyping,
        ]
    })


    client.commands = new Collection();
    const commandsPath = path.join('./commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (let file of commandFiles) {
        const command = (await import(`./commands/${file}`) ).default;
        client.commands.set(command.data.name, command);
    }


    // creating a new collection type or list
    const eventsPath = path.join('./events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (let file of eventFiles) {
        const discordEvent = (await import(`./events/${file}`)).default;
        if (discordEvent.once) {
            client.once(discordEvent.name, (...args) => discordEvent.execute(...args));
        } else {
            client.on(discordEvent.name, (...args) => discordEvent.execute(...args));
        }
    }
    // set activity and activity type
    client.on("ready", ()=> {
        client.user.setActivity('for activity' , { type: ActivityType.Watching});
    })
    
    client.login(token);