const { Events, Guild } = require("discord.js");

const fs = require("fs");
const deployCommands = require("@root/deploy-commands.js")
module.exports = {
  name: Events.GuildCreate,
  /** @param {Guild} guild */
  async execute(guild) {
    deployCommands(guild.client);
  },
};
