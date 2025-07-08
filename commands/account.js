import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import UserDatabaseService from '../services/userDatabaseService.js';

const userDB = new UserDatabaseService();

export default {
    data: new SlashCommandBuilder()
        .setName('account')
        .setDescription('View your FightBot account information'),
    
    async execute(interaction) {
        try {
            const userId = interaction.user.id;
            let user = await userDB.getUserByDiscordId(userId);
            
            // Create user if they don't exist
            if (!user) {
                try {
                    await userDB.createUser(userId, interaction.user.username);
                    user = await userDB.getUserByDiscordId(userId);
                } catch (error) {
                    console.error('Error creating user:', error);
                }
            }
            
            if (!user) {
                const embed = new EmbedBuilder()
                    .setColor(0xff9900)
                    .setTitle('👤 Account Creation Error')
                    .setDescription('There was an issue accessing your account. Please try again.')
                    .setFooter({ text: 'All FightBot features are free to use!' });
                
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('👤 Your FightBot Account')
                .setDescription('🎉 **All features are FREE!** No subscription required.')
                .addFields(
                    { name: '📊 Status', value: 'Free Access ✅', inline: true },
                    { name: '📅 Member Since', value: new Date(user.created_at).toDateString(), inline: true },
                    { name: '🔢 Commands Used', value: user.command_count?.toString() || '0', inline: true },
                    { name: '🌟 Features Available', value: '• Live betting odds\n• Fight analytics\n• Event notifications\n• Export data\n• All premium features!', inline: false }
                )
                .setFooter({ text: 'Enjoying FightBot? Consider supporting us on Patreon!' });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('support_fightbot')
                        .setLabel('❤️ Support FightBot')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('❤️')
                );

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        } catch (error) {
            console.error('Account command error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('❌ Error')
                .setDescription('Sorry, there was an error retrieving your account information.')
                .setFooter({ text: 'All features remain free regardless!' });
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};
