import discordjs from "discord.js";
const { CommandInteraction, Interaction, MessageEmbed } = discordjs;
import { Event, fightParser } from "./fightParser.js";
import ufcService from "./ufcService.js";
import FighterInteractionHandler from "./fighterInteractionHandler.js";

export default class interactionHandler {
  constructor() {
    this.fighterHandler = new FighterInteractionHandler();
  }

  /**
   *
   * @param {Interaction} interaction
   * @returns {void}
   */
  handleInteraction(interaction) {
    // Handle button interactions
    if (interaction.isButton()) {
      return this.handleButtonInteraction(interaction);
    }

    // Handle autocomplete interactions
    if (interaction.isAutocomplete()) {
      return this.handleAutocomplete(interaction);
    }

    // Handle slash commands
    if (!interaction.isCommand()) {
      return;
    }

    const { commandName } = interaction;
    this.handleCommand(interaction, commandName);
  }

  /**
   * Handle button interactions
   * @param {Interaction} interaction
   */
  async handleButtonInteraction(interaction) {
    const customId = interaction.customId;

    // Fighter-related button interactions
    if (customId.startsWith("fighter_") || customId.startsWith("comparison_")) {
      return await this.fighterHandler.handleFighterInteraction(interaction);
    }

    // Add other button handlers here as needed
  }

  /**
   * Handle autocomplete interactions
   * @param {Interaction} interaction
   */
  async handleAutocomplete(interaction) {
    const { commandName } = interaction;

    if (commandName === "fighter") {
      // Import fighter command to handle autocomplete
      const fighterCommand = await import("../commands/fighter.js");
      return await fighterCommand.default.autocomplete(interaction);
    }
  }

  /**
   * Handle choosing what command to use.
   * @param {CommandInteraction} interaction
   * @param {string} command
   * @returns {Promise<void>} a method to handle fights.
   */
  async handleCommand(interaction, command) {
    switch (command) {
      case "fight":
        this.handleFight(interaction);
        break;
      default:
        break;
    }
  }

  /**
   *
   * @returns {Promise<string[]>}
   */
  async getFightLinks() {
    try {
      eventHtml = await ufcService.fetchEvents();
      links = fightParser.parseEvents(eventHtml);
      return links;
    } catch (error) {
      this.logger.error(
        `Failed retrieving events from UFC website - ${error.message}`
      );
      return [];
    }
  }

  /**
   *
   * @param {CommandInteraction} interaction
   * @returns {Promise<void>} a method
   */
  async handleFight(interaction) {
    // If we want links do this
    // const links = await this.getFightLinks();
    // if (links.length === 0) {
    //   interaction.channel.send('Failed retriving event information from UFC');
    //   return;
    // }
    // const [link] = links;

    eventHtml = await ufcService.fetchEvents(link);
    ufcEvent = fightParser.parseEvent(eventHtml);

    await interaction.reply({ embeds: [this.buildFightEmbed(ufcEvent)] });
  }

  /**
   * Build the Fight Embed for discord to show.
   * @param {Event} event Discord Event
   * @param {string} url the url to embed
   * @returns {MessageEmbed} returns a Discord MessageEmbed
   */
  buildFightEmbed(event) {
    embed = new MessageEmbed();
    embed.setTitle(event.title);
    // if we want url pass it in from the handleFight method
    // embed.setURL(url);
    embed.setDescription(`${event.subtitle}\n${event.date}`);
    embed.setThumbnail(event.imgUrl);

    event.fights.forEach((fight) => {
      embed.addField(
        fight.weightClass || "Unknown",
        `${fight.redCorner.rank} ${fight.redCorner.name}\nvs.\n${fight.blueCorner.rank} ${fight.blueCorner.name}`,
        true
      );
    });

    return embed;
  }
}
