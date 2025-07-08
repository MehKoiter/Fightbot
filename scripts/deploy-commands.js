/**
 * Deploy Commands Script - Registers slash commands with Discord
 * Run this script to update slash commands
 */

import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Validate required environment variables
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
    console.error('❌ Missing required environment variables. Please check your .env file.');
    process.exit(1);
}

// Determine if this is a development (guild-specific) or production (global) deployment
const isDev = process.env.NODE_ENV !== 'production';
const isGuildSpecific = isDev && guildId;

if (isDev && !guildId) {
    console.warn('⚠️ No GUILD_ID provided for development. Commands will be registered globally.');
}

// Function to load commands
async function loadCommands() {
    const commands = [];
    const commandsDir = path.join(__dirname, '..', 'src', 'commands');
    
    try {
        // Check for commands directory
        if (!fs.existsSync(commandsDir)) {
            console.error(`❌ Commands directory not found: ${commandsDir}`);
            process.exit(1);
        }
        
        // Get command categories (folders)
        const categories = fs.readdirSync(commandsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'))
            .map(dirent => dirent.name);
        
        // Load commands from each category
        for (const category of categories) {
            const categoryPath = path.join(commandsDir, category);
            
            const commandFiles = fs.readdirSync(categoryPath)
                .filter(file => file.endsWith('.js') && !file.startsWith('_'));
            
            console.log(`📁 Loading commands from category: ${category}`);
            
            // Load each command file
            for (const file of commandFiles) {
                try {
                    const filePath = path.join(categoryPath, file);
                    const fileUrl = new URL(`file://${filePath}`);
                    
                    const command = (await import(fileUrl)).default;
                    
                    // Check if command has getData method
                    if (!command.getData || typeof command.getData !== 'function') {
                        console.warn(`⚠️ Command file ${file} does not have getData method, skipping.`);
                        continue;
                    }
                    
                    const commandData = command.getData();
                    commands.push(commandData);
                    console.log(`✅ Loaded command: ${commandData.name}`);
                } catch (error) {
                    console.error(`❌ Error loading command file ${file}:`, error);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error loading commands:', error);
        process.exit(1);
    }
    
    return commands;
}

// Main function to deploy commands
async function deployCommands() {
    try {
        console.log('🔄 Starting command deployment...');
        
        // Load commands
        const commands = await loadCommands();
        
        if (commands.length === 0) {
            console.warn('⚠️ No commands found to deploy.');
            process.exit(0);
        }
        
        console.log(`📤 Deploying ${commands.length} commands...`);
        
        // Create REST instance
        const rest = new REST().setToken(token);
        
        // Register commands
        let data;
        if (isGuildSpecific) {
            console.log(`🔷 Registering commands for guild: ${guildId} (development mode)`);
            data = await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands }
            );
            console.log(`✅ Successfully registered ${data.length} guild commands.`);
        } else {
            console.log('🔷 Registering global commands');
            data = await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands }
            );
            console.log(`✅ Successfully registered ${data.length} global commands.`);
            console.log('ℹ️ Global commands may take up to 1 hour to propagate to all servers.');
        }
        
    } catch (error) {
        console.error('❌ Error deploying commands:', error);
        process.exit(1);
    }
}

// Execute the script
deployCommands();
