import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import SportsDataMMAService from "../services/sportsDataMMAService.js";
import WikipediaUFCService from "../services/wikipediaUFCService.js";
import { VERSION_CONFIG } from "../config/version.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ufc")
    .setDescription("Get information about a specific UFC event by number")
    .addStringOption((option) =>
      option
        .setName("event_number")
        .setDescription("UFC event number (e.g., 199, 309)")
        .setRequired(true)
    ),

  execute: async (interaction) => {
    try {
      // Check if interaction is already acknowledged
      if (interaction.replied || interaction.deferred) {
        console.log("⚠️ UFC command interaction already acknowledged");
        return;
      }

      // Defer the reply immediately
      await interaction.deferReply();

      // Add a small delay to ensure defer is processed
      await new Promise((resolve) => setTimeout(resolve, 100));

      const eventNumber = interaction.options.getString("event_number");

      // Validate input - check if it's a number or contains UFC
      const cleanEventNumber = eventNumber.replace(/[^\d]/g, "");

      if (!cleanEventNumber || cleanEventNumber.length === 0) {
        const errorEmbed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("❌ Invalid Event Number")
          .setDescription("Please provide a valid UFC event number.")
          .addFields({
            name: "💡 Examples",
            value: "• `/ufc 199`\n• `/ufc 309`\n• `/ufc UFC 285`",
            inline: false,
          })
          .setFooter({ text: "Enter just the number (e.g., 199)" })
          .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
        return;
      }

      // Set a timeout for the service calls
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Service timeout")), 20000)
      );

      // Try Wikipedia first (comprehensive historical data)
      const wikipediaService = new WikipediaUFCService();
      let event = await Promise.race([
        wikipediaService.getUFCEventByNumber(cleanEventNumber),
        timeoutPromise,
      ]);

      let dataSource = "Wikipedia";

      // If Wikipedia didn't find it, try SportsData for newer events
      if (!event) {
        console.log(
          `🔄 Wikipedia didn't find UFC ${cleanEventNumber}, trying SportsData.io...`
        );
        const sportsDataService = new SportsDataMMAService();
        event = await Promise.race([
          sportsDataService.getUFCEventByNumber(cleanEventNumber),
          timeoutPromise,
        ]);
        dataSource = "SportsData.io";
      }

      if (!event) {
        const notFoundEmbed = new EmbedBuilder()
          .setColor("#ff6600")
          .setTitle(`❌ UFC ${cleanEventNumber} Not Found`)
          .setDescription(
            `Sorry, I couldn't find information for UFC ${cleanEventNumber}.`
          )
          .addFields(
            {
              name: "🔍 Possible Reasons",
              value:
                "• Event number doesn't exist\n• Event is too old (only recent years are available)\n• Event may not be in our database yet",
              inline: false,
            },
            {
              name: "💡 Try",
              value:
                "• Check the event number is correct\n• Try a more recent UFC event\n• Use `/fight` for upcoming events",
              inline: false,
            }
          )
          .setFooter({ text: `Searched for: UFC ${cleanEventNumber}` })
          .setTimestamp();

        await interaction.editReply({ embeds: [notFoundEmbed] });
        return;
      }

      // Create the main event embed
      const eventEmbed = new EmbedBuilder()
        .setColor("#ff6600")
        .setTitle(
          `🥊 ${event.title || event.Name || `UFC ${cleanEventNumber}`}`
        )
        .setDescription(
          event.description ||
            event.ShortName ||
            `UFC ${cleanEventNumber} Event Details`
        );

      // Add event details (handle both Wikipedia and SportsData formats)
      const eventDate = event.dateTime || event.DateTime || event.date;
      if (eventDate) {
        const parsedDate = new Date(eventDate);
        if (!isNaN(parsedDate.getTime())) {
          eventEmbed.addFields({
            name: "📅 Date & Time",
            value: `${parsedDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}\n${parsedDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              timeZoneName: "short",
            })}`,
            inline: true,
          });
        } else if (event.date) {
          // Fallback for unparseable dates
          eventEmbed.addFields({
            name: "� Date",
            value: event.date,
            inline: true,
          });
        }
      }

      // Location information (handle both formats)
      const location =
        event.location ||
        event.venue ||
        (event.City && event.Country
          ? `${event.City}, ${event.Country}`
          : null);
      if (location) {
        eventEmbed.addFields({
          name: "📍 Location",
          value: location,
          inline: true,
        });
      }

      if (event.Status) {
        eventEmbed.addFields({
          name: "📊 Status",
          value: event.Status,
          inline: true,
        });
      }

      // Add fight card (handle both Wikipedia and SportsData formats)
      const fights = event.fights || event.Fights;
      if (fights && fights.length > 0) {
        let fightCardText = "";

        if (dataSource === "Wikipedia") {
          // Wikipedia format
          fightCardText = fights
            .slice(0, 8)
            .map((fight, index) => {
              if (fight.fighters && fight.fighters.length >= 2) {
                const emoji = index === 0 ? "👑" : "🥊";
                return `${emoji} **${fight.fighters[0].name}** vs **${fight.fighters[1].name}**`;
              } else if (fight.rawText) {
                const emoji = index === 0 ? "👑" : "🥊";
                return `${emoji} ${fight.rawText}`;
              }
              return null;
            })
            .filter(Boolean)
            .join("\n");
        } else {
          // SportsData format
          const mainCard = fights
            .filter((fight) => fight.Card === "Main" || fight.Order <= 5)
            .sort((a, b) => (b.Order || 0) - (a.Order || 0));

          fightCardText = mainCard
            .slice(0, 8)
            .map((fight, index) => {
              const fighter1 = fight.Fighters?.[0];
              const fighter2 = fight.Fighters?.[1];

              if (fighter1 && fighter2) {
                const emoji = index === 0 ? "👑" : "🥊";
                const name1 = `${fighter1.FirstName} ${fighter1.LastName}`;
                const name2 = `${fighter2.FirstName} ${fighter2.LastName}`;

                return `${emoji} **${name1}** vs **${name2}**${
                  fight.WeightClass ? ` (${fight.WeightClass})` : ""
                }`;
              }
              return null;
            })
            .filter(Boolean)
            .join("\n");
        }

        if (fightCardText) {
          eventEmbed.addFields({
            name: `🥊 Fight Card (${Math.min(fights.length, 8)} fights shown)`,
            value: fightCardText,
            inline: false,
          });
        }

        // Show total fights count
        eventEmbed.addFields({
          name: "📊 Total Fights",
          value: `${fights.length} fights`,
          inline: true,
        });
      }

      // Add footer with source
      eventEmbed.setFooter({
        text: `${VERSION_CONFIG.BOT_NAME} v${VERSION_CONFIG.VERSION} • Data from ${dataSource}`,
      });

      // Use event date for timestamp if available, otherwise current time
      const timestampDate = event.dateTime || event.DateTime || event.date;
      if (timestampDate) {
        const parsedDate = new Date(timestampDate);
        if (!isNaN(parsedDate.getTime())) {
          eventEmbed.setTimestamp(parsedDate);
        } else {
          eventEmbed.setTimestamp();
        }
      } else {
        eventEmbed.setTimestamp();
      }

      // Create action buttons with data source information
      // This ensures the button handler knows which service and ID to use
      const eventIdentifier =
        dataSource === "SportsData.io"
          ? `sports_${event.EventId}`
          : `wiki_${cleanEventNumber}`;

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`ufc_details_${eventIdentifier}`)
          .setLabel("📋 Full Card")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`ufc_stats_${eventIdentifier}`)
          .setLabel("📊 Event Stats")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("ufc_upcoming")
          .setLabel("⏭️ Upcoming Events")
          .setStyle(ButtonStyle.Success)
      );

      await interaction.editReply({
        embeds: [eventEmbed],
        components: [actionRow],
      });
    } catch (error) {
      console.error("❌ Error in UFC command:", error);

      // Create error embed
      const errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Error Loading UFC Event")
        .setDescription(
          "Sorry, something went wrong while fetching the UFC event information."
        )
        .addFields({
          name: "🔧 Possible Issues",
          value:
            "• SportsData.io API may be temporarily unavailable\n• Network connection issues\n• Service timeout",
          inline: false,
        })
        .setFooter({ text: "Please try again in a few minutes" })
        .setTimestamp();

      try {
        if (interaction.deferred && !interaction.replied) {
          await interaction.editReply({ embeds: [errorEmbed] });
        } else if (!interaction.replied) {
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
      } catch (followUpError) {
        console.error("❌ Error sending error message:", followUpError);
      }
    }
  },
};
