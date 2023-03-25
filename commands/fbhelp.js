import { SlashCommandBuilder } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName('fbhelp')
        .setDescription('Ask fightbot for some command help.'), 
    execute: async (interaction) => {
        await interaction.reply('Under Construction')
    },
};
