/**
 * Fighter Command - Streamlined SportsData.io Integration
 * Version 4.2: Optimized Professional Fighter Profiles
 *
 * Features:
 * - Professional fighter profiles from SportsData.io API
 * - Real-time fight statistics and career analytics
 * - Advanced fighter comparisons with detailed analysis
 * - Interactive profile navigation with rich embeds
 * - Intelligent autocomplete with SportsData.io fighters
 * - Enhanced error handling and performance optimization
 * - Memory-efficient caching and response optimization
 * - Clean, maintainable codebase with single API source
 */

import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import SportsDataMMAService from "../services/sportsDataMMAService.js";
import interactionStateManager from "../utils/interactionStateManager.js";

export default {
  data: new SlashCommandBuilder()
    .setName("fighter")
    .setDescription("Get detailed information about a UFC fighter")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Fighter name to search for")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName("compare")
        .setDescription("Compare with another fighter (optional)")
        .setRequired(false)
        .setAutocomplete(true)
    ),

  /**
   * Handle autocomplete for fighter names with enhanced safety and performance
   */
  async autocomplete(interaction) {
    // Early validation
    if (!interactionStateManager.isSafeToRespond(interaction)) {
      console.log("⚠️ Autocomplete interaction not safe - exiting early");
      return;
    }

    try {
      const focusedValue = interaction.options.getFocused()?.trim();

      // Enhanced input validation
      if (!focusedValue || focusedValue.length < 2) {
        await this.safeRespond(interaction, []);
        return;
      }

      // Optimized autocomplete with shorter timeout and better error handling
      const suggestions = await Promise.race([
        this.getAutocompleteSuggestions(focusedValue),
        this.createTimeoutPromise(1200), // Reduced timeout for better UX
      ]);

      await this.safeRespond(interaction, suggestions);
    } catch (error) {
      console.error("Fighter autocomplete error:", error.message);
      // Fail silently to avoid Discord interaction issues
    }
  },

  /**
   * Get autocomplete suggestions with optimized performance
   */
  async getAutocompleteSuggestions(query) {
    const sportsDataService = new SportsDataMMAService();
    const suggestions = await sportsDataService.searchFighters(query);

    if (!Array.isArray(suggestions)) {
      console.log("⚠️ SportsData service returned non-array suggestions");
      return [];
    }

    // Optimized mapping with better performance
    return suggestions
      .map((fighter) => ({
        name: `${fighter.DisplayName}${
          fighter.Nickname ? ` "${fighter.Nickname}"` : ""
        }`,
        value:
          fighter.DisplayName || `${fighter.FirstName} ${fighter.LastName}`,
      }))
      .slice(0, 25); // Discord limit
  },

  /**
   * Create timeout promise helper
   */
  createTimeoutPromise(ms) {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Autocomplete timeout")), ms)
    );
  },

  /**
   * Safely respond to autocomplete with enhanced error handling
   */
  async safeRespond(interaction, suggestions) {
    if (!interactionStateManager.isSafeToRespond(interaction)) {
      return;
    }

    try {
      await interaction.respond(Array.isArray(suggestions) ? suggestions : []);
      console.log(`✅ Autocomplete: ${suggestions.length} suggestions sent`);
    } catch (error) {
      console.log(
        "⚠️ Autocomplete response failed - interaction handled elsewhere"
      );
    }
  },

  /**
   * Execute the fighter command with optimized performance
   */
  async execute(interaction) {
    const fighterName = interaction.options.getString("name");
    const compareFighter = interaction.options.getString("compare");

    try {
      const sportsDataService = new SportsDataMMAService();
      let hasDeferred = false;

      // Optimized defer helper
      const safeDeferReply = async () => {
        if (!hasDeferred && !interaction.replied && !interaction.deferred) {
          try {
            await new Promise((resolve) => setTimeout(resolve, 50)); // Reduced delay

            if (!interaction.replied && !interaction.deferred) {
              await interaction.deferReply();
              hasDeferred = true;
            }
          } catch (error) {
            console.error("Failed to defer reply:", error.message);

            if (error.code === 40060 || error.code === 10062) {
              console.log(
                "Interaction already handled - continuing without defer"
              );
              return;
            }
            throw error;
          }
        }
      };

      // Optimized response helper
      const safeResponse = async (responseData) => {
        try {
          if (hasDeferred || interaction.deferred) {
            await interaction.editReply(responseData);
          } else {
            await interaction.reply(responseData);
          }
        } catch (error) {
          console.error("Failed to send response:", error.message);
          throw error;
        }
      };

      // Handle comparison requests
      if (compareFighter) {
        await safeDeferReply();
        return await this.handleComparison(
          sportsDataService,
          fighterName,
          compareFighter,
          safeResponse
        );
      }

      // Handle single fighter profile with optimized flow
      await this.handleSingleFighter(
        sportsDataService,
        fighterName,
        safeDeferReply,
        safeResponse
      );
    } catch (error) {
      console.error("Fighter command error:", error.message);
      await this.handleCommandError(interaction, error);
    }
  },

  /**
   * Handle fighter comparison with optimized error handling
   */
  async handleComparison(
    sportsDataService,
    fighterName,
    compareFighter,
    safeResponse
  ) {
    try {
      const comparison = await sportsDataService.compareFighters(
        fighterName,
        compareFighter
      );

      if (!comparison) {
        const errorEmbed = this.createErrorEmbed(
          "❌ Fighter Comparison Failed",
          `Could not find detailed information for "${fighterName}" or "${compareFighter}".`,
          "• Check spelling\n• Try using full names\n• Use autocomplete suggestions"
        );
        await safeResponse({ embeds: [errorEmbed] });
        return;
      }

      const comparisonEmbed = await this.createComparisonEmbed(
        comparison.fighter1,
        comparison.fighter2
      );
      const comparisonButtons = this.createComparisonButtons(
        fighterName,
        compareFighter
      );

      await safeResponse({
        embeds: [comparisonEmbed],
        components: [comparisonButtons],
      });
    } catch (error) {
      console.error("Comparison handling error:", error.message);
      throw error;
    }
  },

  /**
   * Handle single fighter profile with performance optimization
   */
  async handleSingleFighter(
    sportsDataService,
    fighterName,
    safeDeferReply,
    safeResponse
  ) {
    let fighter;

    try {
      // Optimized fighter search and profile retrieval
      const searchResults = await sportsDataService.searchFighters(fighterName);
      if (!searchResults?.length) {
        throw new Error("Fighter not found in search");
      }

      // Try fast response first, fallback to deferred if needed
      try {
        fighter = await Promise.race([
          sportsDataService.getFighterProfile(searchResults[0].FighterId),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 2000)
          ),
        ]);
      } catch (timeoutError) {
        await safeDeferReply();
        fighter = await sportsDataService.getFighterProfile(
          searchResults[0].FighterId
        );
      }

      if (!fighter) {
        const errorEmbed = this.createErrorEmbed(
          "❌ Fighter Not Found",
          `Could not find a fighter named "${fighterName}".`,
          "• Check the spelling\n• Try using the fighter's full name\n• Use the autocomplete feature"
        );
        await safeResponse({ embeds: [errorEmbed] });
        return;
      }

      // Create and send fighter profile
      const profileEmbed = await this.createFighterEmbed(fighter);
      const actionButtons = this.createActionButtons(fighterName);

      await safeResponse({
        embeds: [profileEmbed],
        components: [actionButtons],
      });
    } catch (error) {
      console.error("Single fighter handling error:", error.message);
      throw error;
    }
  },

  /**
   * Handle command errors with improved user feedback
   */
  async handleCommandError(interaction, error) {
    const errorEmbed = this.createErrorEmbed(
      "❌ Command Error",
      "An error occurred while fetching fighter information.",
      "• Try again in a moment\n• Check your internet connection\n• Contact support if this persists"
    );

    try {
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else if (!interaction.replied) {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    } catch (replyError) {
      console.error("❌ Failed to send error response:", replyError.message);
    }
  },

  /**
   * Create standardized error embed
   */
  createErrorEmbed(title, description, tips) {
    return new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle(title)
      .setDescription(description)
      .addFields({
        name: "💡 Tips",
        value: tips,
        inline: false,
      })
      .setTimestamp();
  },

  /**
   * Create detailed fighter profile embed with optimized data handling
   */
  async createFighterEmbed(fighter) {
    // Helper function for safe data extraction
    const safeGet = (value, fallback = "N/A") => value || fallback;
    const safeName =
      fighter.DisplayName || `${fighter.FirstName} ${fighter.LastName}`;

    // Calculate stats efficiently
    const wins = fighter.Wins || 0;
    const losses = fighter.Losses || 0;
    const draws = fighter.Draws || 0;
    const winRate =
      wins && losses ? ((wins / (wins + losses)) * 100).toFixed(1) : "0";

    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle(
        `🥊 ${safeName}${fighter.Nickname ? ` "${fighter.Nickname}"` : ""}`
      )
      .setDescription("**Professional Mixed Martial Artist**")
      .addFields(
        {
          name: "📊 Fight Record",
          value:
            `**${wins}-${losses}-${draws}**\n` +
            `Wins: ${wins} | Losses: ${losses} | Draws: ${draws}\n` +
            `Win Rate: ${winRate}%`,
          inline: true,
        },
        {
          name: "📏 Physical Stats",
          value:
            `**Height:** ${safeGet(fighter.Height)}\n` +
            `**Weight:** ${safeGet(fighter.Weight)}\n` +
            `**Reach:** ${safeGet(fighter.Reach)}\n` +
            `**Stance:** ${safeGet(fighter.Stance)}`,
          inline: true,
        },
        {
          name: "🏟️ Fighter Info",
          value:
            `**Division:** ${safeGet(fighter.WeightClass)}\n` +
            `**Born:** ${
              fighter.BirthDate
                ? new Date(fighter.BirthDate).toLocaleDateString()
                : "N/A"
            }\n` +
            `**Nationality:** ${safeGet(fighter.Nationality)}\n` +
            `**Team:** ${safeGet(fighter.Team)}`,
          inline: true,
        }
      );

    // Add championship info if available
    if (fighter.TitleWins > 0) {
      embed.addFields({
        name: "🏆 Championships",
        value: `Title Wins: ${fighter.TitleWins}\nTitle Losses: ${fighter.TitleLosses}\nTitle Draws: ${fighter.TitleDraws}`,
        inline: false,
      });
    }

    // Add photo if available
    if (fighter.PhotoUrl) {
      embed.setThumbnail(fighter.PhotoUrl);
    }

    return embed
      .setTimestamp()
      .setFooter({
        text: "FightBot • SportsData.io Professional Fighter Profiles",
      });
  },

  /**
   * Create comparison embed for two fighters with enhanced analytics
   */
  async createComparisonEmbed(fighter1, fighter2) {
    // Helper for safe calculations
    const calcWinRate = (fighter) => {
      const wins = fighter.Wins || 0;
      const losses = fighter.Losses || 0;
      return wins && losses ? ((wins / (wins + losses)) * 100).toFixed(1) : "0";
    };

    const f1Record = `${fighter1.Wins || 0}-${fighter1.Losses || 0}-${
      fighter1.Draws || 0
    }`;
    const f2Record = `${fighter2.Wins || 0}-${fighter2.Losses || 0}-${
      fighter2.Draws || 0
    }`;
    const f1WinRate = calcWinRate(fighter1);
    const f2WinRate = calcWinRate(fighter2);

    // Enhanced analytics
    const f1Experience =
      (fighter1.Wins || 0) + (fighter1.Losses || 0) + (fighter1.Draws || 0);
    const f2Experience =
      (fighter2.Wins || 0) + (fighter2.Losses || 0) + (fighter2.Draws || 0);
    const experienceEdge =
      f1Experience > f2Experience
        ? fighter1.DisplayName
        : f2Experience > f1Experience
        ? fighter2.DisplayName
        : "Even";
    const recordEdge =
      f1WinRate > f2WinRate
        ? fighter1.DisplayName
        : f2WinRate > f1WinRate
        ? fighter2.DisplayName
        : "Even";

    return new EmbedBuilder()
      .setColor("#ff6600")
      .setTitle("⚔️ Fighter Comparison")
      .setDescription(
        `**${fighter1.DisplayName}** vs **${fighter2.DisplayName}**`
      )
      .addFields(
        {
          name: `🥊 ${fighter1.DisplayName}`,
          value:
            `**Record:** ${f1Record} (${f1WinRate}% win rate)\n` +
            `**Height:** ${fighter1.Height || "N/A"}\n` +
            `**Weight:** ${fighter1.Weight || "N/A"}\n` +
            `**Reach:** ${fighter1.Reach || "N/A"}\n` +
            `**Division:** ${fighter1.WeightClass || "N/A"}`,
          inline: true,
        },
        {
          name: `🥊 ${fighter2.DisplayName}`,
          value:
            `**Record:** ${f2Record} (${f2WinRate}% win rate)\n` +
            `**Height:** ${fighter2.Height || "N/A"}\n` +
            `**Weight:** ${fighter2.Weight || "N/A"}\n` +
            `**Reach:** ${fighter2.Reach || "N/A"}\n` +
            `**Division:** ${fighter2.WeightClass || "N/A"}`,
          inline: true,
        },
        {
          name: "⚖️ Analysis",
          value:
            `**Experience Edge:** ${experienceEdge}\n` +
            `**Record Edge:** ${recordEdge}\n` +
            `**Title Wins:** ${fighter1.TitleWins || 0} vs ${
              fighter2.TitleWins || 0
            }`,
          inline: false,
        }
      )
      .setTimestamp()
      .setFooter({ text: "FightBot • SportsData.io Fighter Comparison" });
  },

  /**
   * Create action buttons for fighter profile
   */
  createActionButtons(fighterName) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`fighter_stats_${fighterName}`)
        .setLabel("📊 Detailed Stats")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`fighter_highlights_${fighterName}`)
        .setLabel("🎬 Fight Highlights")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`fighter_compare_${fighterName}`)
        .setLabel("⚔️ Compare Fighter")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`fighter_refresh_${fighterName}`)
        .setLabel("🔄 Refresh")
        .setStyle(ButtonStyle.Secondary)
    );
  },

  /**
   * Create comparison buttons
   */
  createComparisonButtons(fighter1, fighter2) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`comparison_detailed_${fighter1}_vs_${fighter2}`)
        .setLabel("📊 Detailed Analysis")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`comparison_styles_${fighter1}_vs_${fighter2}`)
        .setLabel("🥊 Fighting Styles")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`comparison_prediction_${fighter1}_vs_${fighter2}`)
        .setLabel("🔮 Fight Prediction")
        .setStyle(ButtonStyle.Success)
    );
  },
};
