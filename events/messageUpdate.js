const { Events } = require('discord.js');

const fs = require('fs');

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage,newMessage) {
        


       console.log("update", newMessage.author.username, newMessage.author.id, newMessage.content)
       if (newMessage.author.bot) return;

       
    }
}