import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("donate")
    .setDescription("Support FightBot development via Patreon"),

  async execute(interaction) {
    try {
      // Defer reply immediately to prevent timeout
      await interaction.deferReply({ ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor(0xff424d)
        .setTitle("❤️ Support FightBot")
        .setDescription(
          "FightBot is now completely **FREE** for everyone! All premium features are unlocked.\n\nIf you enjoy using FightBot and want to support its development, consider becoming a patron!"
        )
        .addFields(
          {
            name: "🎯 What You Get",
            value:
              "✅ **All features are already FREE!**\n• Live betting odds\n• Fight analytics\n• Event notifications\n• Export data\n• Priority support\n\n*No subscription required!*",
            inline: false,
          },
          {
            name: "💖 Support Development",
            value:
              "Your donations help:\n• Keep the bot running 24/7\n• Add new features\n• Improve data accuracy\n• Maintain server costs",
            inline: false,
          },
          {
            name: "🌟 Patreon Benefits",
            value:
              "• Early access to new features\n• Direct feedback channel\n• Special donor role\n• Development updates",
            inline: false,
          }
        )
        .setFooter({ text: "Thank you for supporting FightBot! ❤️" });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Support on Patreon")
          .setStyle(ButtonStyle.Link)
          .setURL("https://patreon.com/fightbot")
          .setEmoji("❤️")
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
      console.error("Donate command error:", error);

      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("❌ Error")
        .setDescription(
          "Sorry, there was an error displaying the donation information. Please try again later."
        )
        .setFooter({ text: "All features remain free regardless!" });

      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        } else {
          await interaction.editReply({ embeds: [errorEmbed] });
        }
      } catch (replyError) {
        console.error("Failed to send error response:", replyError);
      }
    }
  },
};
