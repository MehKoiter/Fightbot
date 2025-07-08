import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('account')
        .setDescription('View your FightBot account information'),
    
    async execute(interaction) {
        try {
            const username = interaction.user.username;
            
            // All users have full access now - no account needed
            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle(`👤 ${username}'s Account`)
                .setDescription('FightBot no longer tracks individual user accounts. All features are free for everyone!')
                .addFields(
                    { name: '✅ Account Status', value: 'All features unlocked', inline: true },
                    { name: '🎮 Commands', value: 'Use `/help` to see all available commands', inline: true },
                    { name: '❤️ Support FightBot', value: 'Consider supporting on Patreon if you enjoy FightBot', inline: false }
                )
                .setFooter({ text: 'All FightBot features are free to use!' });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Support on Patreon')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://patreon.com/fightbot')
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
