const { Events, MessageReaction } = require("discord.js");

const fs = require("fs");

module.exports = {
  name: Events.MessageReactionAdd,
  async execute(reaction,user) {
    console.log("reactionAdd", reaction, user);
    
  },
};
