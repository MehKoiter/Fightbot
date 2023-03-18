const { Client, GatewayIntentBits } = require('discord.js')
require('dotenv/config')

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
        ]
    })

    client.on('ready',()=> {
        console.log('bot is ready')
    } )
    client.on('messageCreate', message => {
        if (message.content === '#fights'){
            message.reply('UFC 286 is this weekend')
        }
    })

    client.login(process.env.TOKEN)