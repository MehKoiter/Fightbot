import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { VERSION_CONFIG } from "../config/version.js";

export default {
    data: new SlashCommandBuilder()
        .setName('support')
        .setDescription('Get support information and contact details'),
    
    execute: async (interaction) => {
        const supportEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🛠️ FightBot Support')
            .setDescription('Need help or have questions? We\'re here to assist!')
            .addFields(
                {
                    name: '📧 Contact Support',
                    value: '• **Email:** support@fightbot.com\n• **Discord:** Join our support server\n• **Response Time:** 24-48 hours',
                    inline: false
                },
                {
                    name: '🚀 Premium Upgrades',
                    value: '• **Sales:** premium@fightbot.com\n• **Billing:** billing@fightbot.com\n• **Custom Solutions:** enterprise@fightbot.com',
                    inline: false
                },
                {
                    name: '📖 Resources',
                    value: '• **Documentation:** [docs.fightbot.com](https://docs.fightbot.com)\n• **FAQ:** Use `/help` command\n• **Status:** [status.fightbot.com](https://status.fightbot.com)',
                    inline: false
                },
                {
                    name: '🐛 Report Bugs',
                    value: 'Found a bug? Please include:\n• Command used\n• Error message\n• Expected behavior\n• Screenshots (if applicable)',
                    inline: false
                },
                {
                    name: '💡 Feature Requests',
                    value: 'Have an idea for FightBot? We\'d love to hear it!\nSend your suggestions to: features@fightbot.com',
                    inline: false
                }
            )
            .setFooter({ text: `FightBot ${VERSION_CONFIG.version} • We appreciate your feedback!` })
            .setTimestamp();

        await interaction.reply({ embeds: [supportEmbed] });
    }
};
