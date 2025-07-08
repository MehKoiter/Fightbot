/**
 * Preferences Command - Manage user settings and preferences
 */

import { EmbedBuilder } from 'discord.js';
import BaseCommand from '../baseCommand.js';

class PreferencesCommand extends BaseCommand {
    constructor() {
        super();
        
        this.builder
            .setName('preferences')
            .setDescription('Manage your personal settings and favorites')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('list')
                    .setDescription('View your current preferences'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('set')
                    .setDescription('Set a preference')
                    .addStringOption(option =>
                        option.setName('key')
                            .setDescription('Preference to set')
                            .setRequired(true)
                            .addChoices(
                                { name: 'Favorite Fighter', value: 'favorite_fighter' },
                                { name: 'Favorite Weight Class', value: 'favorite_weight_class' },
                                { name: 'Notifications', value: 'notifications' }
                            ))
                    .addStringOption(option =>
                        option.setName('value')
                            .setDescription('Value to set')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('clear')
                    .setDescription('Clear a preference')
                    .addStringOption(option =>
                        option.setName('key')
                            .setDescription('Preference to clear')
                            .setRequired(true)
                            .addChoices(
                                { name: 'Favorite Fighter', value: 'favorite_fighter' },
                                { name: 'Favorite Weight Class', value: 'favorite_weight_class' },
                                { name: 'Notifications', value: 'notifications' },
                                { name: 'All Preferences', value: 'all' }
                            )));
    }
    
    /**
     * Execute the command
     * @param {Interaction} interaction - Discord interaction
     */
    async execute(interaction) {
        try {
            // Track command usage
            await this.trackCommandUsage('preferences');
            
            // Get services from container
            const userService = this.container.has('userService') ? 
                this.container.get('userService') : null;
            
            if (!userService) {
                await interaction.reply({
                    content: '⚠️ User preferences service is not yet implemented. Coming soon!',
                    ephemeral: true
                });
                return;
            }
            
            const subcommand = interaction.options.getSubcommand();
            
            switch (subcommand) {
                case 'list':
                    await this.listPreferences(interaction, userService);
                    break;
                    
                case 'set':
                    await this.setPreference(interaction, userService);
                    break;
                    
                case 'clear':
                    await this.clearPreference(interaction, userService);
                    break;
                    
                default:
                    await interaction.reply({
                        content: '❌ Invalid subcommand. Please use /preferences list, /preferences set, or /preferences clear.',
                        ephemeral: true
                    });
            }
            
        } catch (error) {
            await this.handleError(interaction, error);
        }
    }
    
    /**
     * List user preferences
     * @param {Interaction} interaction - Discord interaction
     * @param {UserService} userService - User service instance
     */
    async listPreferences(interaction, userService) {
        // Get user preferences
        const userId = interaction.user.id;
        const preferences = await userService.getUserPreferences(userId);
        
        // Create embed
        const prefsEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('Your Preferences')
            .setDescription('Here are your current FightBot settings:')
            .addFields(
                {
                    name: '🥊 Favorite Fighter',
                    value: preferences.favorite_fighter || 'Not set',
                    inline: true
                },
                {
                    name: '⚖️ Favorite Weight Class',
                    value: preferences.favorite_weight_class || 'Not set',
                    inline: true
                },
                {
                    name: '🔔 Notifications',
                    value: preferences.notifications ? 'Enabled' : 'Disabled',
                    inline: true
                }
            )
            .setFooter({ text: 'Use /preferences set to update your preferences' })
            .setTimestamp();
            
        // Send embed
        await interaction.reply({ embeds: [prefsEmbed], ephemeral: true });
    }
    
    /**
     * Set a user preference
     * @param {Interaction} interaction - Discord interaction
     * @param {UserService} userService - User service instance
     */
    async setPreference(interaction, userService) {
        const userId = interaction.user.id;
        const key = interaction.options.getString('key');
        const value = interaction.options.getString('value');
        
        await userService.setUserPreference(userId, key, value);
        
        await interaction.reply({
            content: `✅ Your ${key.replace('_', ' ')} has been set to "${value}".`,
            ephemeral: true
        });
    }
    
    /**
     * Clear a user preference
     * @param {Interaction} interaction - Discord interaction
     * @param {UserService} userService - User service instance
     */
    async clearPreference(interaction, userService) {
        const userId = interaction.user.id;
        const key = interaction.options.getString('key');
        
        if (key === 'all') {
            await userService.clearAllUserPreferences(userId);
            await interaction.reply({
                content: '✅ All your preferences have been cleared.',
                ephemeral: true
            });
        } else {
            await userService.clearUserPreference(userId, key);
            await interaction.reply({
                content: `✅ Your ${key.replace('_', ' ')} preference has been cleared.`,
                ephemeral: true
            });
        }
    }
}

export default new PreferencesCommand();
