const { SlashCommandBuilder, InteractionHandler } = require('discord.js');
const { Axios } = require('axios');
const { Cheerio } = require('cheerio');

    module.exports = {
        data: new SlashCommandBuilder()
            .setName('fight')
            .setDescription('This weekends fight if there is one'),
        async execute(interaction) {
                Axios.get('https://www.ufc.com/events')
                .then((res) => console.log(res))
                .catch((err) => console.log(err))

                //await interaction.reply('https://www.ufc.com/events');
        },
    };
