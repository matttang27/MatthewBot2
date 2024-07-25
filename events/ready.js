const { Events, InteractionType } = require("discord.js");
const deployCommands = require("@root/deploy-commands.js")

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {

    console.log(`Ready! Logged in as ${client.user.tag}`);
    deployCommands(client);
    
    
  },
};
