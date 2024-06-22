const { Events, InteractionType } = require("discord.js");

const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {

    console.log(`Ready! Logged in as ${client.user.tag}`);
    
    
    
  },
};
