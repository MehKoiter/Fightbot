/**
 * Fighter Button Interaction Handler
 * Phase 7: Advanced Fighter Features
 *
 * Handles button interactions for fighter profiles and comparisons
 */

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import FighterService from "../services/fighterService.js";

export default class FighterInteractionHandler {
  constructor() {
    this.fighterService = new FighterService();
  }

  /**
   * Handle fighter-related button interactions
   */
  async handleFighterInteraction(interaction) {
    try {
      const customId = interaction.customId;

      // Parse button interaction
      if (customId.startsWith("fighter_stats_")) {
        await this.handleDetailedStats(interaction);
      } else if (customId.startsWith("fighter_highlights_")) {
        await this.handleFightHighlights(interaction);
      } else if (customId.startsWith("fighter_compare_")) {
        await this.handleComparePrompt(interaction);
      } else if (customId.startsWith("fighter_refresh_")) {
        await this.handleRefreshProfile(interaction);
      } else if (customId.startsWith("fighter_back_")) {
        await this.handleBackToProfile(interaction);
      } else if (customId.startsWith("comparison_detailed_")) {
        await this.handleDetailedComparison(interaction);
      } else if (customId.startsWith("comparison_styles_")) {
        await this.handleFightingStyles(interaction);
      } else if (customId.startsWith("comparison_prediction_")) {
        await this.handleFightPrediction(interaction);
      }
    } catch (error) {
      console.error("Fighter interaction error:", error);

      const errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Interaction Error")
        .setDescription("An error occurred while processing your request.")
        .setTimestamp();

      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }

  /**
   * Handle detailed stats button
   */
  async handleDetailedStats(interaction) {
    await interaction.deferReply();

    const fighterName = interaction.customId.replace("fighter_stats_", "");
    const fighter = await this.fighterService.getFighterProfile(fighterName);

    if (!fighter) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Fighter Not Found")
        .setDescription(`Could not load detailed stats for "${fighterName}".`)
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
      return;
    }

    const statsEmbed = new EmbedBuilder()
      .setColor("#0066ff")
      .setTitle(`📊 ${fighter.name} - Detailed Statistics`)
      .addFields(
        {
          name: "🥊 Striking Analytics",
          value:
            `**Significant Strikes Landed:** ${fighter.fightingStyle.striking.avgPerMinute}/min\n` +
            `**Striking Accuracy:** ${fighter.fightingStyle.striking.accuracy}\n` +
            `**Striking Defense:** ${fighter.fightingStyle.striking.defense}\n` +
            `**Knockdown Ratio:** ${(
              (fighter.record.winsByKO / fighter.record.wins) *
              100
            ).toFixed(1)}%`,
          inline: true,
        },
        {
          name: "🤼 Grappling Analytics",
          value:
            `**Takedown Accuracy:** ${fighter.fightingStyle.grappling.takedownAccuracy}\n` +
            `**Takedown Defense:** ${fighter.fightingStyle.grappling.takedownDefense}\n` +
            `**Average Takedowns:** ${fighter.fightingStyle.grappling.avgPerFight}/fight\n` +
            `**Submission Rate:** ${(
              (fighter.record.winsBySubmission / fighter.record.wins) *
              100
            ).toFixed(1)}%`,
          inline: true,
        },
        {
          name: "🏆 Career Statistics",
          value:
            `**Total Fights:** ${
              fighter.record.wins + fighter.record.losses + fighter.record.draws
            }\n` +
            `**Win Percentage:** ${(
              (fighter.record.wins /
                (fighter.record.wins + fighter.record.losses)) *
              100
            ).toFixed(1)}%\n` +
            `**Finish Rate:** ${(
              ((fighter.record.winsByKO + fighter.record.winsBySubmission) /
                fighter.record.wins) *
              100
            ).toFixed(1)}%\n` +
            `**Decision Rate:** ${(
              (fighter.record.winsByDecision / fighter.record.wins) *
              100
            ).toFixed(1)}%`,
          inline: false,
        },
        {
          name: "🎯 Fighting Style Analysis",
          value:
            `**Primary Stance:** ${fighter.physicalStats.stance}\n` +
            `**Reach Advantage:** ${fighter.physicalStats.reach} (${fighter.physicalStats.legReach} leg)\n` +
            `**Control Time:** ${fighter.fightingStyle.ground.controlTime}/fight\n` +
            `**Submission Attempts:** ${fighter.fightingStyle.ground.submissionAvg}/fight`,
          inline: false,
        }
      )
      .setTimestamp()
      .setFooter({ text: "FightBot • Advanced Fighter Analytics" });

    const backButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`fighter_back_${fighterName}`)
        .setLabel("← Back to Profile")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`fighter_compare_${fighterName}`)
        .setLabel("⚔️ Compare Fighter")
        .setStyle(ButtonStyle.Success)
    );

    await interaction.editReply({
      embeds: [statsEmbed],
      components: [backButton],
    });
  }

  /**
   * Handle fight highlights button
   */
  async handleFightHighlights(interaction) {
    await interaction.deferReply();

    const fighterName = interaction.customId.replace("fighter_highlights_", "");
    const fighter = await this.fighterService.getFighterProfile(fighterName);

    if (!fighter) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Fighter Not Found")
        .setDescription(`Could not load highlights for "${fighterName}".`)
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
      return;
    }

    const highlightsEmbed = new EmbedBuilder()
      .setColor("#ff6600")
      .setTitle(`🎬 ${fighter.name} - Career Highlights`)
      .setDescription(`**Top performances and memorable moments**`)
      .addFields(
        {
          name: "🔥 Most Notable Fights",
          value:
            fighter.highlights
              .map((highlight, index) => `${index + 1}. ${highlight}`)
              .join("\n") || "No highlights available",
          inline: false,
        },
        {
          name: "🏆 Career Achievements",
          value:
            fighter.achievements
              .slice(0, 5)
              .map((achievement, index) => `• ${achievement}`)
              .join("\n") || "Professional Fighter",
          inline: false,
        },
        {
          name: "📱 Follow on Social Media",
          value:
            `**Instagram:** ${fighter.socialMedia.instagram}\n` +
            `**Twitter:** ${fighter.socialMedia.twitter}`,
          inline: false,
        }
      );

    if (fighter.lastFight) {
      highlightsEmbed.addFields({
        name: "⚔️ Last Performance",
        value:
          `**vs ${fighter.lastFight.opponent}** - ${fighter.lastFight.result}\n` +
          `${fighter.lastFight.method} in Round ${fighter.lastFight.round}\n` +
          `${fighter.lastFight.date}`,
        inline: false,
      });
    }

    highlightsEmbed
      .setTimestamp()
      .setFooter({ text: "FightBot • Career Highlights" });

    const backButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`fighter_back_${fighterName}`)
        .setLabel("← Back to Profile")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel("🌐 Watch on UFC.com")
        .setStyle(ButtonStyle.Link)
        .setURL(
          `https://www.ufc.com/athlete/${fighterName
            .toLowerCase()
            .replace(" ", "-")}`
        )
    );

    await interaction.editReply({
      embeds: [highlightsEmbed],
      components: [backButton],
    });
  }

  /**
   * Handle compare prompt
   */
  async handleComparePrompt(interaction) {
    const fighterName = interaction.customId.replace("fighter_compare_", "");

    const promptEmbed = new EmbedBuilder()
      .setColor("#ffff00")
      .setTitle("⚔️ Fighter Comparison")
      .setDescription(
        `To compare **${fighterName}** with another fighter, use the command:\n\n` +
          `\`/fighter name:${fighterName} compare:[fighter name]\`\n\n` +
          `**Example:**\n` +
          `\`/fighter name:${fighterName} compare:Jon Jones\``
      )
      .addFields({
        name: "💡 Pro Tip",
        value:
          "Use the autocomplete feature to quickly find fighters to compare!",
        inline: false,
      })
      .setTimestamp()
      .setFooter({ text: "FightBot • Fighter Comparison Tool" });

    await interaction.reply({ embeds: [promptEmbed], ephemeral: true });
  }

  /**
   * Handle refresh profile
   */
  async handleRefreshProfile(interaction) {
    await interaction.deferUpdate();

    const fighterName = interaction.customId.replace("fighter_refresh_", "");

    // Clear cache for this fighter
    this.fighterService.clearCache();

    const fighter = await this.fighterService.getFighterProfile(fighterName);

    if (!fighter) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Refresh Failed")
        .setDescription(`Could not refresh profile for "${fighterName}".`)
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
      return;
    }

    // Re-create the profile embed (reuse from fighter command)
    const { createFighterEmbed, createActionButtons } = await import(
      "./fighter.js"
    );
    const profileEmbed = await createFighterEmbed(fighter);
    const actionButtons = createActionButtons(fighterName);

    await interaction.editReply({
      embeds: [profileEmbed],
      components: [actionButtons],
    });
  }

  /**
   * Handle detailed comparison
   */
  async handleDetailedComparison(interaction) {
    await interaction.deferReply();

    const fighters = interaction.customId
      .replace("comparison_detailed_", "")
      .split("_vs_");
    const [fighter1Name, fighter2Name] = fighters;

    const comparison = await this.fighterService.compareFighters(
      fighter1Name,
      fighter2Name
    );

    if (!comparison) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Comparison Failed")
        .setDescription("Could not load detailed comparison data.")
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
      return;
    }

    const { fighter1, fighter2, comparison: comp } = comparison;

    const detailedEmbed = new EmbedBuilder()
      .setColor("#9900ff")
      .setTitle(`📊 Detailed Fighter Analysis`)
      .setDescription(`**${fighter1.name}** vs **${fighter2.name}**`)
      .addFields(
        {
          name: "🥊 Striking Comparison",
          value:
            `**${fighter1.name}:**\n` +
            `Accuracy: ${fighter1.fightingStyle.striking.accuracy}\n` +
            `Defense: ${fighter1.fightingStyle.striking.defense}\n\n` +
            `**${fighter2.name}:**\n` +
            `Accuracy: ${fighter2.fightingStyle.striking.accuracy}\n` +
            `Defense: ${fighter2.fightingStyle.striking.defense}`,
          inline: true,
        },
        {
          name: "🤼 Grappling Comparison",
          value:
            `**${fighter1.name}:**\n` +
            `TD Accuracy: ${fighter1.fightingStyle.grappling.takedownAccuracy}\n` +
            `TD Defense: ${fighter1.fightingStyle.grappling.takedownDefense}\n\n` +
            `**${fighter2.name}:**\n` +
            `TD Accuracy: ${fighter2.fightingStyle.grappling.takedownAccuracy}\n` +
            `TD Defense: ${fighter2.fightingStyle.grappling.takedownDefense}`,
          inline: true,
        },
        {
          name: "📏 Physical Matchup",
          value:
            comp.physical.heightAdvantage !== 0
              ? `**Height:** ${
                  comp.physical.heightAdvantage > 0
                    ? fighter1.name
                    : fighter2.name
                } +${Math.abs(comp.physical.heightAdvantage)}"\n`
              : "**Height:** Even matchup\n" +
                (comp.physical.reachAdvantage !== 0
                  ? `**Reach:** ${
                      comp.physical.reachAdvantage > 0
                        ? fighter1.name
                        : fighter2.name
                    } +${Math.abs(comp.physical.reachAdvantage).toFixed(1)}"`
                  : "**Reach:** Even matchup"),
          inline: false,
        }
      )
      .setTimestamp()
      .setFooter({ text: "FightBot • Advanced Fighter Comparison" });

    await interaction.editReply({ embeds: [detailedEmbed] });
  }

  /**
   * Handle fighting styles comparison
   */
  async handleFightingStyles(interaction) {
    await interaction.deferReply();

    const fighters = interaction.customId
      .replace("comparison_styles_", "")
      .split("_vs_");
    const [fighter1Name, fighter2Name] = fighters;

    const comparison = await this.fighterService.compareFighters(
      fighter1Name,
      fighter2Name
    );

    if (!comparison) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Style Analysis Failed")
        .setDescription("Could not load fighting style comparison.")
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
      return;
    }

    const { fighter1, fighter2 } = comparison;

    const stylesEmbed = new EmbedBuilder()
      .setColor("#00ff99")
      .setTitle(`🥊 Fighting Style Analysis`)
      .setDescription(`**${fighter1.name}** vs **${fighter2.name}**`)
      .addFields(
        {
          name: `🎯 ${fighter1.name}'s Style`,
          value:
            `**Stance:** ${fighter1.physicalStats.stance}\n` +
            `**Striking Style:** ${
              parseFloat(fighter1.fightingStyle.striking.accuracy) > 60
                ? "Accurate Striker"
                : "Volume Striker"
            }\n` +
            `**Grappling Style:** ${
              parseFloat(fighter1.fightingStyle.grappling.takedownAccuracy) > 50
                ? "Takedown Heavy"
                : "Defensive Grappler"
            }\n` +
            `**Finish Rate:** ${(
              ((fighter1.record.winsByKO + fighter1.record.winsBySubmission) /
                fighter1.record.wins) *
              100
            ).toFixed(1)}%`,
          inline: true,
        },
        {
          name: `🎯 ${fighter2.name}'s Style`,
          value:
            `**Stance:** ${fighter2.physicalStats.stance}\n` +
            `**Striking Style:** ${
              parseFloat(fighter2.fightingStyle.striking.accuracy) > 60
                ? "Accurate Striker"
                : "Volume Striker"
            }\n` +
            `**Grappling Style:** ${
              parseFloat(fighter2.fightingStyle.grappling.takedownAccuracy) > 50
                ? "Takedown Heavy"
                : "Defensive Grappler"
            }\n` +
            `**Finish Rate:** ${(
              ((fighter2.record.winsByKO + fighter2.record.winsBySubmission) /
                fighter2.record.wins) *
              100
            ).toFixed(1)}%`,
          inline: true,
        },
        {
          name: "⚔️ Style Matchup Analysis",
          value:
            `This analysis shows how the fighters' styles might interact in a potential matchup.\n\n` +
            `**Key Factors:**\n` +
            `• Striking accuracy vs volume\n` +
            `• Grappling offense vs defense\n` +
            `• Finish rate and fight pace`,
          inline: false,
        }
      )
      .setTimestamp()
      .setFooter({ text: "FightBot • Fighting Style Analysis" });

    await interaction.editReply({ embeds: [stylesEmbed] });
  }

  /**
   * Handle fight prediction
   */
  async handleFightPrediction(interaction) {
    await interaction.deferReply();

    const fighters = interaction.customId
      .replace("comparison_prediction_", "")
      .split("_vs_");
    const [fighter1Name, fighter2Name] = fighters;

    const comparison = await this.fighterService.compareFighters(
      fighter1Name,
      fighter2Name
    );

    if (!comparison) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Prediction Failed")
        .setDescription("Could not generate fight prediction.")
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
      return;
    }

    const { fighter1, fighter2, comparison: comp } = comparison;

    // Simple prediction logic based on various factors
    const f1Score = this.calculateFighterScore(
      fighter1,
      comp.advantages.fighter1
    );
    const f2Score = this.calculateFighterScore(
      fighter2,
      comp.advantages.fighter2
    );

    const favorite = f1Score > f2Score ? fighter1 : fighter2;
    const underdog = f1Score > f2Score ? fighter2 : fighter1;
    const confidence = Math.abs(f1Score - f2Score) > 10 ? "High" : "Low";

    const predictionEmbed = new EmbedBuilder()
      .setColor("#ffff00")
      .setTitle(`🔮 Fight Prediction`)
      .setDescription(`**${fighter1.name}** vs **${fighter2.name}**`)
      .addFields(
        {
          name: "🏆 Prediction",
          value:
            `**Favorite:** ${favorite.name}\n` +
            `**Method:** ${this.predictMethod(favorite)}\n` +
            `**Confidence:** ${confidence}\n` +
            `**Estimated Odds:** ${f1Score > f2Score ? "60-40" : "40-60"}`,
          inline: true,
        },
        {
          name: "📊 Key Factors",
          value:
            `**${favorite.name} Advantages:**\n` +
            `${
              comp.advantages[f1Score > f2Score ? "fighter1" : "fighter2"]
                .slice(0, 3)
                .join("\n") || "Experience"
            }\n\n` +
            `**${underdog.name} Path to Victory:**\n` +
            `${
              comp.advantages[f1Score > f2Score ? "fighter2" : "fighter1"]
                .slice(0, 2)
                .join("\n") || "Upset potential"
            }`,
          inline: true,
        },
        {
          name: "⚠️ Disclaimer",
          value:
            "This prediction is based on available statistics and should be used for entertainment purposes only. MMA is unpredictable!",
          inline: false,
        }
      )
      .setTimestamp()
      .setFooter({ text: "FightBot • Fight Prediction Engine" });

    await interaction.editReply({ embeds: [predictionEmbed] });
  }

  /**
   * Calculate fighter score for predictions
   */
  calculateFighterScore(fighter, advantages) {
    let score = 50; // Base score

    // Record score
    const winRate =
      (fighter.record.wins / (fighter.record.wins + fighter.record.losses)) *
      100;
    score += (winRate - 50) * 0.5;

    // Experience score
    const totalFights = fighter.record.wins + fighter.record.losses;
    score += Math.min(totalFights * 0.5, 10);

    // Advantages score
    score += advantages.length * 3;

    // Age penalty (if over 35)
    if (fighter.physicalStats.age > 35) {
      score -= (fighter.physicalStats.age - 35) * 2;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Predict likely method of victory
   */
  predictMethod(fighter) {
    const koRate = (fighter.record.winsByKO / fighter.record.wins) * 100;
    const subRate =
      (fighter.record.winsBySubmission / fighter.record.wins) * 100;
    const decRate = (fighter.record.winsByDecision / fighter.record.wins) * 100;

    if (koRate > subRate && koRate > decRate) {
      return "KO/TKO";
    } else if (subRate > koRate && subRate > decRate) {
      return "Submission";
    } else {
      return "Decision";
    }
  }

  /**
   * Handle back to profile button
   */
  async handleBackToProfile(interaction) {
    const fighterName = interaction.customId.replace("fighter_back_", "");

    // For now, send a simple "back to profile" message
    // This could be enhanced to actually reload the full fighter profile
    const backEmbed = new EmbedBuilder()
      .setColor("#00ff00")
      .setTitle("← Back to Profile")
      .setDescription(`Returning to ${fighterName}'s fighter profile...`)
      .addFields({
        name: "💡 Tip",
        value: "Use `/fighter` command to view the full profile again.",
        inline: false,
      })
      .setTimestamp()
      .setFooter({ text: "FightBot • All Features FREE Forever!" });

    await interaction.reply({ embeds: [backEmbed], ephemeral: true });
  }
}
