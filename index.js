// import fetchEvents from './fetchEvents.js';
// setting requirements for index.js to run
// GatewauIntentBits is the language used for discord.js to know what things to monitor

import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { token } from './config.js';
import handleCommand from './services/interactionHandler.js';
import fs from 'node:fs';
import path from'node:path';

    client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.DirectMessageTyping,
        ]
    })

    
    client.commands = new Collection();
    commandsPath = path.join(__dirname, 'commands');
    commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (file of commandFiles) {
        filePath = path.join(commandsPath, file);
        command = require(filePath);
        client.commands.set(command.data.name, command);
    }


    // creating a new collection type or list
    eventsPath = path.join(__dirname, 'events');
    eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (file of eventFiles) {
        filePath = path.join(eventsPath, file);
        discordEvent = require(filePath);
        if (discordEvent.once) {
            client.once(discordEvent.name, (...args) => discordEvent.execute(...args));
        } else {
            client.on(discordEvent.name, handleCommand);
        }
    }


    client.login(token);