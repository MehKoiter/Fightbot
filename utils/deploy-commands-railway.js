#!/usr/bin/env node

/**
 * Deploy commands for Railway production environment
 * This script can be run manually after deployment if needed
 */

import { REST, Routes } from 'discord.js';
import { readdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const commands = [];

try {
    console.log('🔄 Loading command files...');
    const commandFiles = await readdir(join(__dirname, '../commands'));
    
    for (const file of commandFiles.filter(file => file.endsWith('.js'))) {
        const command = await import(`../commands/${file}`);
        if (command.default?.data?.toJSON) {
            commands.push(command.default.data.toJSON());
            console.log(`✅ Loaded command: ${command.default.data.name}`);
        }
    }
    
    console.log(`📦 Total commands to deploy: ${commands.length}`);
    
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    
    console.log('🚀 Deploying commands globally...');
    
    const data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
    );
    
    console.log(`✅ Successfully deployed ${data.length} commands globally!`);
    console.log('🎉 Commands are now available in all servers where the bot is added.');
    
} catch (error) {
    console.error('❌ Command deployment failed:', error);
    
    if (error.code === 50001) {
        console.error('🔒 Missing access. Make sure the bot has application.commands scope.');
    } else if (error.code === 401) {
        console.error('🔑 Invalid token. Check your DISCORD_TOKEN environment variable.');
    }
    
    process.exit(1);
}
