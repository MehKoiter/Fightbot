import { SlashCommandBuilder } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName('fight')
        .setDescription('This weekends fight if there is one'), 
        async execute(interaction) {await interaction.reply('https://www.ufc.com/events')},
};

