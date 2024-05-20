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
const Game = require("./game");


module.exports = {
    data: new SlashCommandBuilder()
    .setName("testgame")
    .setDescription("Tests the game class"),
    async execute(interaction) {
        var game = new Game(interaction);

        game.create();
    }
}


