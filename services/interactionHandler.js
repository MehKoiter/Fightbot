import { CommandInteraction, Interaction, MessageEmbed } from 'discord.js';
import { Event, parseEvent, parseEvents } from './fightParser';
import { fetchEvents } from './ufcService';

export default class interactionHandler {

  /**
   * 
   * @param {Interaction} interaction 
   * @returns {void}
   */
  handleInteraction(interaction) {
    if (!interaction.isCommand()) {
      return;
    }

    const { commandName } = interaction;

    this.handleCommand(interaction, commandName);
  }
  
  /**
   * Handle choosing what command to use.
   * @param {CommandInteraction} interaction 
   * @param {string} command 
   * @returns {Promise<void>} a method to handle fights. 
   */
  async handleCommand(interaction, command) {
    switch (command) {
      case 'fight':
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
      eventHtml = await fetchEvents();
      links = parseEvents(eventHtml);
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

    eventHtml = await fetchEvents(link);
    ufcEvent = parseEvent(eventHtml);

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
            fight.weightClass || 'Unknown',
            `${fight.redCorner.rank} ${fight.redCorner.name}\nvs.\n${fight.blueCorner.rank} ${fight.blueCorner.name}`,
            true
          );
        });
    
        return embed;
    }
}