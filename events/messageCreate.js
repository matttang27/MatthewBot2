const { Events } = require("discord.js");

const fs = require("fs");

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    console.log("create",message.author.username, message.author.id, message.content);
    if (message.author.bot) return;
  },
};
