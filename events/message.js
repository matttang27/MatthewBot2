const { Events } = require('discord.js');

const fs = require('fs');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;


       console.log(message.author, message.content)
    }
}