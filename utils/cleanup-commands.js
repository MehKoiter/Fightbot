import { REST, Routes } from 'discord.js';
import { clientId, guildId, token } from './config.js';

const rest = new REST({ version: '10' }).setToken(token);

console.log('🔧 FightBot Command Cleanup Tool');
console.log('=================================');

async function cleanup() {
    try {
        console.log('🧹 Starting command cleanup...\n');

        // Clear global commands
        console.log('🌍 Clearing global commands...');
        await rest.put(Routes.applicationCommands(clientId), { body: [] });
        console.log('✅ Global commands cleared');

        // Clear guild commands if guildId exists
        if (guildId) {
            console.log(`🏠 Clearing guild commands for ${guildId}...`);
            await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
            console.log('✅ Guild commands cleared');
        }

        console.log('\n🎉 Command cleanup completed!');
        console.log('💡 Next steps:');
        console.log('   1. Run "npm run deploy" to register commands to your guild (instant)');
        console.log('   2. OR run "node deploy-commands.js --global" for global deployment (takes 1 hour)');
        console.log('   3. Choose ONE method to avoid duplicates');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        process.exit(1);
    }
}

cleanup();
