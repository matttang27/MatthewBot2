const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
  ComponentType,
  Collection,
  MessageType,
} = require("discord.js");

const Connect4Game = require('./connect4game');
module.exports = {
  data: new SlashCommandBuilder()
    .setName("connect4")
    .setDescription("Creates a new Connect4 game"),
  async execute(interaction) {
    var game = new Connect4Game(interaction).create();
  },
};
