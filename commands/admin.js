import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import UserDatabaseService from '../services/userDatabaseService.js';

const userDB = new UserDatabaseService();

export default {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Admin commands for FightBot')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('View subscription statistics')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('View user information')
                .addUserOption(option =>
                    option
                        .setName('target')
                        .setDescription('The user to check')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('revenue')
                .setDescription('View revenue analytics')
        ),
    
    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'stats':
                    await handleStats(interaction);
                    break;
                case 'user':
                    await handleUserInfo(interaction);
                    break;
                case 'revenue':
                    await handleRevenue(interaction);
                    break;
                default:
                    await interaction.reply({ content: 'Unknown subcommand', ephemeral: true });
            }

        } catch (error) {
            console.error('Admin command error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('❌ Admin Error')
                .setDescription('An error occurred while executing the admin command.')
                .setFooter({ text: 'Check logs for details' });
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};

async function handleStats(interaction) {
    const stats = await userDB.getSubscriptionStats();
    
    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('📊 FightBot Subscription Statistics')
        .addFields(
            { name: '👥 Total Users', value: stats.totalUsers.toString(), inline: true },
            { name: '⭐ Premium Users', value: stats.activeSubscriptions.toString(), inline: true },
            { name: '📈 Conversion Rate', value: `${((stats.activeSubscriptions / stats.totalUsers) * 100).toFixed(1)}%`, inline: true },
            { name: '💰 Monthly Revenue', value: `$${(stats.activeSubscriptions * 4.99).toFixed(2)}`, inline: true },
            { name: '📅 This Month', value: stats.newUsersThisMonth.toString(), inline: true },
            { name: '🔄 Renewals', value: stats.renewalsThisMonth.toString(), inline: true }
        )
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleUserInfo(interaction) {
    const targetUser = interaction.options.getUser('target');
    const userData = await userDB.getUserByDiscordId(targetUser.id);
    
    if (!userData) {
        const embed = new EmbedBuilder()
            .setColor(0xff9900)
            .setTitle('👤 User Not Found')
            .setDescription(`${targetUser.username} is not in the FightBot database.`);
        
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setColor(userData.subscription_status === 'active' ? 0x00ff00 : 0xff9900)
        .setTitle(`👤 ${targetUser.username}'s Account`)
        .addFields(
            { name: '📊 Status', value: userData.subscription_status === 'active' ? 'Premium ✅' : 'Free 📝', inline: true },
            { name: '📅 Joined', value: new Date(userData.created_at).toDateString(), inline: true },
            { name: '🔢 Commands', value: userData.command_count?.toString() || '0', inline: true },
            { name: '💳 Customer ID', value: userData.stripe_customer_id || 'None', inline: true }
        );

    if (userData.subscription_end) {
        embed.addFields({ name: '📆 Expires', value: new Date(userData.subscription_end).toDateString(), inline: true });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleRevenue(interaction) {
    const revenueData = await userDB.getRevenueAnalytics();
    
    const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('💰 Revenue Analytics')
        .addFields(
            { name: '📊 Monthly Revenue', value: `$${revenueData.monthlyRevenue.toFixed(2)}`, inline: true },
            { name: '📈 YTD Revenue', value: `$${revenueData.yearToDateRevenue.toFixed(2)}`, inline: true },
            { name: '🎯 Average LTV', value: `$${revenueData.averageLifetimeValue.toFixed(2)}`, inline: true },
            { name: '📉 Churn Rate', value: `${revenueData.churnRate.toFixed(1)}%`, inline: true },
            { name: '💎 Retention', value: `${revenueData.retentionRate.toFixed(1)}%`, inline: true },
            { name: '📅 Total Payments', value: revenueData.totalPayments.toString(), inline: true }
        )
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
}
