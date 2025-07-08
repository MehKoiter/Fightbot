import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import UserPreferencesService from "../services/userPreferencesService.js";
import { VERSION_CONFIG, isFeatureEnabled } from "../config/version.js";

const userPrefs = new UserPreferencesService();

export default {
    data: new SlashCommandBuilder()
        .setName('preferences')
        .setDescription('Manage your FightBot preferences and settings (Premium feature)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View your current preferences'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('notifications')
                .setDescription('Manage notification preferences')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Notification type to toggle')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Fight Results', value: 'fightResults' },
                            { name: 'Odds Changes', value: 'oddsChanges' },
                            { name: 'Favorite Fighters', value: 'favoritesFights' },
                            { name: 'Event Reminders', value: 'eventReminders' },
                            { name: 'Breaking News', value: 'breakingNews' }
                        ))
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable or disable this notification type')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('favorites')
                .setDescription('Manage favorite fighters')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Add or remove fighter from favorites')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Add Fighter', value: 'add' },
                            { name: 'Remove Fighter', value: 'remove' },
                            { name: 'List Favorites', value: 'list' }
                        ))
                .addStringOption(option =>
                    option.setName('fighter')
                        .setDescription('Fighter name (required for add/remove)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('display')
                .setDescription('Manage display preferences')
                .addStringOption(option =>
                    option.setName('timezone')
                        .setDescription('Your timezone')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('odds_format')
                        .setDescription('Preferred odds format')
                        .setRequired(false)
                        .addChoices(
                            { name: 'American (+150, -110)', value: 'american' },
                            { name: 'Decimal (2.50, 1.91)', value: 'decimal' },
                            { name: 'Fractional (3/2, 10/11)', value: 'fractional' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('export')
                .setDescription('Export your preferences'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset all preferences to default')),
    
    execute: async (interaction) => {
        // Check if premium feature
        if (!isFeatureEnabled('personalizedFeed')) {
            const featureLockedEmbed = new EmbedBuilder()
                .setColor('#ff6347')
                .setTitle('🔒 Premium Feature')
                .setDescription(VERSION_CONFIG.messages.featureDisabled)
                .addFields({
                    name: '🌟 Available in Premium',
                    value: '• Custom notification preferences\n• Favorite fighter tracking\n• Personalized display settings\n• Data export capabilities\n• Advanced user preferences',
                    inline: false
                })
                .setFooter({ text: 'Use /premium to learn more about upgrading' });
            
            await interaction.reply({ embeds: [featureLockedEmbed], ephemeral: true });
            return;
        }

        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;

        try {
            switch (subcommand) {
                case 'view':
                    await this.showPreferences(interaction, userId);
                    break;
                case 'notifications':
                    await this.manageNotifications(interaction, userId);
                    break;
                case 'favorites':
                    await this.manageFavorites(interaction, userId);
                    break;
                case 'display':
                    await this.manageDisplay(interaction, userId);
                    break;
                case 'export':
                    await this.exportPreferences(interaction, userId);
                    break;
                case 'reset':
                    await this.resetPreferences(interaction, userId);
                    break;
                default:
                    await this.showPreferences(interaction, userId);
            }
        } catch (error) {
            console.error('Error in preferences command:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('Unable to manage preferences at this time. Please try again later.');
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },

    async showPreferences(interaction, userId) {
        const prefs = userPrefs.getUserPreferences(userId);
        
        const prefsEmbed = new EmbedBuilder()
            .setColor('#9932cc')
            .setTitle('⚙️ Your FightBot Preferences')
            .setDescription('Current settings for your FightBot Premium account')
            .addFields(
                {
                    name: '🔔 Notifications',
                    value: `• Fight Results: ${prefs.notifications.fightResults ? '✅' : '❌'}\n` +
                           `• Odds Changes: ${prefs.notifications.oddsChanges ? '✅' : '❌'}\n` +
                           `• Favorite Fighters: ${prefs.notifications.favoritesFights ? '✅' : '❌'}\n` +
                           `• Event Reminders: ${prefs.notifications.eventReminders ? '✅' : '❌'}\n` +
                           `• Breaking News: ${prefs.notifications.breakingNews ? '✅' : '❌'}`,
                    inline: true
                },
                {
                    name: '🖥️ Display',
                    value: `• Timezone: ${prefs.display.timezone}\n` +
                           `• Odds Format: ${prefs.betting.oddsFormat}\n` +
                           `• Spoilers: ${prefs.display.showSpoilers ? 'Show' : 'Hide'}\n` +
                           `• Detail Level: ${prefs.analytics.detailLevel}`,
                    inline: true
                },
                {
                    name: '⭐ Favorites',
                    value: `• Fighters: ${prefs.favorites.fighters.length} saved\n` +
                           `• Weight Classes: ${prefs.favorites.weightClasses.length} selected\n` +
                           `• Organizations: ${prefs.favorites.organizations.join(', ')}`,
                    inline: false
                },
                {
                    name: '💰 Betting Preferences',
                    value: `• Show Odds: ${prefs.betting.showOdds ? 'Yes' : 'No'}\n` +
                           `• Preferred Books: ${prefs.betting.preferredSportsbooks.slice(0, 3).join(', ')}\n` +
                           `• Alert Threshold: ${(prefs.betting.alertThreshold * 100).toFixed(0)}% movement`,
                    inline: false
                }
            )
            .setFooter({ text: 'Use /preferences <subcommand> to modify these settings' })
            .setTimestamp();

        // Add action buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prefs_notifications')
                    .setLabel('🔔 Notifications')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('prefs_favorites')
                    .setLabel('⭐ Favorites')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('prefs_export')
                    .setLabel('📤 Export')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('prefs_reset')
                    .setLabel('🔄 Reset')
                    .setStyle(ButtonStyle.Danger)
            );

        await interaction.reply({ embeds: [prefsEmbed], components: [row], ephemeral: true });
    },

    async manageNotifications(interaction, userId) {
        const type = interaction.options.getString('type');
        const enabled = interaction.options.getBoolean('enabled');
        
        const notifications = {};
        notifications[type] = enabled;
        
        const updatedNotifications = userPrefs.updateNotificationPreferences(userId, notifications);
        
        const embed = new EmbedBuilder()
            .setColor(enabled ? '#00ff00' : '#ff6347')
            .setTitle('🔔 Notification Preferences Updated')
            .setDescription(`**${this.getNotificationDisplayName(type)}** notifications have been ${enabled ? 'enabled' : 'disabled'}.`)
            .addFields({
                name: '📋 Current Notification Settings',
                value: Object.entries(updatedNotifications)
                    .map(([key, value]) => `• ${this.getNotificationDisplayName(key)}: ${value ? '✅' : '❌'}`)
                    .join('\n'),
                inline: false
            })
            .setFooter({ text: 'These settings apply to all FightBot notifications' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async manageFavorites(interaction, userId) {
        const action = interaction.options.getString('action');
        const fighter = interaction.options.getString('fighter');
        
        let embed;
        
        switch (action) {
            case 'add':
                if (!fighter) {
                    embed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('❌ Error')
                        .setDescription('Please provide a fighter name to add to favorites.');
                    break;
                }
                
                const favorites = userPrefs.addFavoriteFighter(userId, fighter);
                embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('⭐ Fighter Added to Favorites')
                    .setDescription(`**${fighter}** has been added to your favorites!`)
                    .addFields({
                        name: '📋 Your Favorite Fighters',
                        value: favorites.length > 0 ? favorites.join('\n') : 'No favorites yet',
                        inline: false
                    });
                break;
                
            case 'remove':
                if (!fighter) {
                    embed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('❌ Error')
                        .setDescription('Please provide a fighter name to remove from favorites.');
                    break;
                }
                
                const remainingFavorites = userPrefs.removeFavoriteFighter(userId, fighter);
                embed = new EmbedBuilder()
                    .setColor('#ff6347')
                    .setTitle('⭐ Fighter Removed from Favorites')
                    .setDescription(`**${fighter}** has been removed from your favorites.`)
                    .addFields({
                        name: '📋 Your Favorite Fighters',
                        value: remainingFavorites.length > 0 ? remainingFavorites.join('\n') : 'No favorites yet',
                        inline: false
                    });
                break;
                
            case 'list':
                const prefs = userPrefs.getUserPreferences(userId);
                embed = new EmbedBuilder()
                    .setColor('#9932cc')
                    .setTitle('⭐ Your Favorite Fighters')
                    .setDescription(prefs.favorites.fighters.length > 0 ? 
                        `You have ${prefs.favorites.fighters.length} favorite fighters:` : 
                        'You haven\'t added any favorite fighters yet.')
                    .addFields({
                        name: '📋 Favorite Fighters',
                        value: prefs.favorites.fighters.length > 0 ? 
                            prefs.favorites.fighters.map((fighter, index) => `${index + 1}. ${fighter}`).join('\n') : 
                            'Use `/preferences favorites add` to add fighters',
                        inline: false
                    });
                break;
        }
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async manageDisplay(interaction, userId) {
        const timezone = interaction.options.getString('timezone');
        const oddsFormat = interaction.options.getString('odds_format');
        
        const prefs = userPrefs.getUserPreferences(userId);
        let updated = false;
        
        if (timezone) {
            prefs.display.timezone = timezone;
            updated = true;
        }
        
        if (oddsFormat) {
            prefs.betting.oddsFormat = oddsFormat;
            updated = true;
        }
        
        if (updated) {
            userPrefs.setUserPreferences(userId, prefs);
        }
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🖥️ Display Preferences Updated')
            .setDescription('Your display preferences have been updated successfully.')
            .addFields(
                {
                    name: '⏰ Timezone',
                    value: prefs.display.timezone,
                    inline: true
                },
                {
                    name: '💰 Odds Format',
                    value: prefs.betting.oddsFormat,
                    inline: true
                }
            )
            .setFooter({ text: 'Changes will apply to all future FightBot responses' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async exportPreferences(interaction, userId) {
        const exportData = userPrefs.exportPreferences(userId);
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('📤 Preferences Exported')
            .setDescription('Your preferences have been exported successfully.')
            .addFields({
                name: '📋 Export Details',
                value: `• Export Date: ${new Date().toLocaleDateString()}\n• Version: ${exportData.version}\n• File Size: ${JSON.stringify(exportData).length} characters`,
                inline: false
            })
            .setFooter({ text: 'Save this data to restore your preferences later' });

        // In a real implementation, you might upload this to a file service
        const exportString = JSON.stringify(exportData, null, 2);
        
        await interaction.reply({ 
            embeds: [embed], 
            files: [{
                attachment: Buffer.from(exportString),
                name: `fightbot-preferences-${userId}-${Date.now()}.json`
            }],
            ephemeral: true 
        });
    },

    async resetPreferences(interaction, userId) {
        const defaultPrefs = userPrefs.getDefaultPreferences();
        userPrefs.setUserPreferences(userId, defaultPrefs);
        
        const embed = new EmbedBuilder()
            .setColor('#ff6347')
            .setTitle('🔄 Preferences Reset')
            .setDescription('All your preferences have been reset to default values.')
            .addFields({
                name: '📋 Default Settings Restored',
                value: '• All notifications enabled except odds changes and breaking news\n• Timezone set to UTC\n• American odds format\n• Standard analytics detail level\n• All favorites cleared',
                inline: false
            })
            .setFooter({ text: 'You can reconfigure your preferences using the preferences command' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    getNotificationDisplayName(type) {
        const names = {
            fightResults: 'Fight Results',
            oddsChanges: 'Odds Changes',
            favoritesFights: 'Favorite Fighters',
            eventReminders: 'Event Reminders',
            breakingNews: 'Breaking News'
        };
        return names[type] || type;
    }
};
