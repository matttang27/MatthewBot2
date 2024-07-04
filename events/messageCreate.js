const { Events } = require("discord.js");

const fs = require("fs");

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    console.log("create");
    console.log(message);
    if (message.author.bot) return;
  },
};
