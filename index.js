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
        if (message.content === '/fights'){
            message.reply('https://www.ufc.com/events')
        }
    })

    client.login(process.env.TOKEN)