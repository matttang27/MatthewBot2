const { Events } = require('discord.js');

const fs = require('fs');

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage,newMessage) {
        


       console.log("update")
       console.log(oldMessage);
       console.log(newMessage);
       if (newMessage.author.bot) return;

       
    }
}