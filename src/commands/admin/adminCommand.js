/**
 * Admin Command - Administrative features for bot owners and moderators
 */

import { EmbedBuilder } from 'discord.js';
import BaseCommand from '../baseCommand.js';

class AdminCommand extends BaseCommand {
    constructor() {
        super();
        
        this.builder
            .setName('admin')
            .setDescription('Administrative commands for bot management')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('stats')
                    .setDescription('View bot statistics'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('refresh')
                    .setDescription('Refresh data caches'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('shutdown')
                    .setDescription('Shutdown the bot (Owner only)'));
    }
    
    /**
     * Execute the command
     * @param {Interaction} interaction - Discord interaction
     */
    async execute(interaction) {
        try {
            // Track command usage
            await this.trackCommandUsage('admin');
            
            // Check if user has admin permissions
            if (!await this.isAdmin(interaction)) {
                await interaction.reply({
                    content: '❌ You do not have permission to use this command.',
                    ephemeral: true
                });
                return;
            }
            
            const subcommand = interaction.options.getSubcommand();
            
            switch (subcommand) {
                case 'stats':
                    await this.showStats(interaction);
                    break;
                    
                case 'refresh':
                    await this.refreshCaches(interaction);
                    break;
                    
                case 'shutdown':
                    await this.shutdownBot(interaction);
                    break;
                    
                default:
                    await interaction.reply({
                        content: '❌ Invalid subcommand.',
                        ephemeral: true
                    });
            }
            
        } catch (error) {
            await this.handleError(interaction, error);
        }
    }
    
    /**
     * Check if user has admin permissions
     * @param {Interaction} interaction - Discord interaction
     * @returns {Promise<boolean>} Whether user is an admin
     */
    async isAdmin(interaction) {
        // Check if interaction is from a guild
        if (!interaction.guild) return false;
        
        // Check if user is the bot owner
        const appInfo = await interaction.client.application.fetch();
        const isOwner = interaction.user.id === appInfo.owner.id;
        
        if (isOwner) return true;
        
        // Check if user has admin permissions in the guild
        const member = await interaction.guild.members.fetch(interaction.user.id);
        return member.permissions.has('Administrator');
    }
    
    /**
     * Show bot statistics
     * @param {Interaction} interaction - Discord interaction
     */
    async showStats(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        // Get statistics from the analytics service
        const analytics = this.container.get('analytics');
        const stats = await analytics.getStats();
        
        // Get memory usage
        const memoryUsage = process.memoryUsage();
        const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        
        // Create statistics embed
        const statsEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🤖 FightBot Statistics')
            .addFields(
                {
                    name: '📊 Command Usage',
                    value: `Total: ${stats.commandTotal}\n` +
                           `Fight: ${stats.commandCounts.fight || 0}\n` +
                           `Help: ${stats.commandCounts.help || 0}\n` +
                           `Info: ${stats.commandCounts.info || 0}`,
                    inline: true
                },
                {
                    name: '⚙️ System',
                    value: `Memory: ${memoryUsageMB} MB\n` +
                           `Uptime: ${Math.floor(process.uptime() / 60)} minutes\n` +
                           `Node: ${process.version}`,
                    inline: true
                },
                {
                    name: '👥 Users',
                    value: `Servers: ${interaction.client.guilds.cache.size}\n` +
                           `Users: ${stats.uniqueUsers || 'N/A'}\n` +
                           `Active: ${stats.activeUsers || 'N/A'}`,
                    inline: true
                }
            )
            .setTimestamp();
        
        await interaction.editReply({ embeds: [statsEmbed] });
    }
    
    /**
     * Refresh data caches
     * @param {Interaction} interaction - Discord interaction
     */
    async refreshCaches(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        // Clear caches
        const cacheService = this.container.get('eventCache');
        cacheService.clear();
        
        // Clear UFC service cache
        const ufcService = this.container.get('ufc');
        if (typeof ufcService.clearCache === 'function') {
            ufcService.clearCache();
        }
        
        await interaction.editReply({ content: '✅ All caches have been refreshed successfully.' });
    }
    
    /**
     * Shutdown the bot (Owner only)
     * @param {Interaction} interaction - Discord interaction
     */
    async shutdownBot(interaction) {
        // This requires owner permission
        const appInfo = await interaction.client.application.fetch();
        if (interaction.user.id !== appInfo.owner.id) {
            await interaction.reply({
                content: '❌ Only the bot owner can use this command.',
                ephemeral: true
            });
            return;
        }
        
        await interaction.reply({
            content: '⚠️ Bot is shutting down now. Goodbye!',
            ephemeral: true
        });
        
        // Log the shutdown
        this.container.get('logger').warn(`Bot shutdown requested by ${interaction.user.tag} (${interaction.user.id})`);
        
        // Exit after a short delay
        setTimeout(() => {
            process.exit(0);
        }, 1000);
    }
}

export default new AdminCommand();
