const { SlashCommandBuilder } = require('discord.js');
const { axios } = require('axios');

    module.exports = {
        data: new SlashCommandBuilder()
            .setName('fight')
            .setDescription('This weekends fight if there is one'),
        async execute(interaction) {
                axios.get('https://www.ufc.com/events')
                .then((res) => console.log(res))
                .catch((err) => console.log(err))

                //await interaction.reply('https://www.ufc.com/events');
        },
    };