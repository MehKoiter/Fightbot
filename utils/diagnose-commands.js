import { REST, Routes } from 'discord.js';
import { clientId, guildId, token } from '../config.js';

const rest = new REST({ version: '10' }).setToken(token);

console.log('🔍 FightBot Command Diagnostic Tool');
console.log('=====================================');

async function checkCommands() {
    try {
        console.log('📋 Checking registered commands...\n');

        // Check global commands
        console.log('🌍 GLOBAL COMMANDS:');
        console.log('-------------------');
        try {
            const globalCommands = await rest.get(Routes.applicationCommands(clientId));
            if (globalCommands.length > 0) {
                globalCommands.forEach(cmd => {
                    console.log(`• ${cmd.name} - ${cmd.description}`);
                });
            } else {
                console.log('✅ No global commands registered');
            }
        } catch (error) {
            console.log('❌ Error fetching global commands:', error.message);
        }

        console.log('');

        // Check guild commands if guildId is available
        if (guildId) {
            console.log(`🏠 GUILD COMMANDS (${guildId}):`);
            console.log('-------------------------------');
            try {
                const guildCommands = await rest.get(Routes.applicationGuildCommands(clientId, guildId));
                if (guildCommands.length > 0) {
                    guildCommands.forEach(cmd => {
                        console.log(`• ${cmd.name} - ${cmd.description}`);
                    });
                } else {
                    console.log('✅ No guild-specific commands registered');
                }
            } catch (error) {
                console.log('❌ Error fetching guild commands:', error.message);
            }
        } else {
            console.log('ℹ️  No GUILD_ID found in environment variables');
        }

        console.log('\n📊 SUMMARY:');
        console.log('------------');
        
        const totalGlobal = await rest.get(Routes.applicationCommands(clientId)).then(c => c.length).catch(() => 0);
        const totalGuild = guildId ? await rest.get(Routes.applicationGuildCommands(clientId, guildId)).then(c => c.length).catch(() => 0) : 0;
        
        console.log(`Global commands: ${totalGlobal}`);
        if (guildId) console.log(`Guild commands: ${totalGuild}`);
        console.log(`Total visible commands: ${totalGlobal + totalGuild}`);
        
        if (totalGlobal > 0 && totalGuild > 0) {
            console.log('\n⚠️  WARNING: Commands are registered both globally AND to guild!');
            console.log('   This causes duplicate commands in Discord.');
            console.log('   Recommendation: Use EITHER global OR guild commands, not both.');
        }

    } catch (error) {
        console.error('❌ Error during diagnostic:', error);
    }
}

checkCommands();
