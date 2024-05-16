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

const { errorEmbed, successEmbed, returnEmotes } = require("../../functions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("connect4")
    .setDescription("Creates a new Connect4 game"),
  properties: {
    minPlayers: 2,
    maxPlayers: 10,
  },
  defaultEmojis: [
    ":blue_circle:",
    ":red_circle:",
    ":yellow_circle:",
    ":purple_circle:",
    ":green_circle:",
    ":orange_circle:",
  ],
  options: [
    {
      name: "height",
      label: "Height",
      desc: "Enter the height of the board (2 to 20)",
      type: "num",
      value: 6,
      filter: (m) =>
        !isNaN(m.content) &&
        parseInt(m.content) >= 2 &&
        parseInt(m.content) <= 20,
    },
    {
      name: "width",
      label: "Width",
      desc: "Enter the width of the board (2 to 20)",
      type: "num",
      value: 7,
      filter: (m) =>
        !isNaN(m.content) &&
        parseInt(m.content) >= 2 &&
        parseInt(m.content) <= 20,
    },
    {
      name: "winLength",
      label: "Win Length",
      desc: "Enter the amount of pieces in a row required to win (2 to 10)",
      type: "num",
      value: 4,
      filter: (m) =>
        !isNaN(m.content) &&
        parseInt(m.content) >= 2 &&
        parseInt(m.content) <= 10,
    },
  ],
  async execute(interaction) {

    const START_TITLE = "Connect4 game created! "
    await interaction.deferReply();

    players = new Collection();

    players.set(interaction.user.id, interaction.user);

    /*
    let p1 = await interaction.guild.members.fetch("576031405037977600");
    let p2 = await interaction.guild.members.fetch("720352012402688000");
    players.set("576031405037977600", p1);
    players.set("720352012402688000", p2);*/

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("Connect4 game created!");

    this.updateLobby(players, embed);
    embed.setTitle(START_TITLE + ` [${players.size}/${this.properties.maxPlayers}]`)

    

    const start = new ButtonBuilder()
      .setCustomId("start")
      .setLabel("Start")
      .setStyle(ButtonStyle.Primary);

    const join = new ButtonBuilder()
      .setCustomId("joinleave")
      .setLabel("Join / Leave")
      .setStyle(ButtonStyle.Secondary);

    const cancel = new ButtonBuilder()
      .setCustomId("cancel")
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(start, join, cancel);

    const response = await interaction.editReply({
      embeds: [embed],
      components: [row],
    });

    cancelled = false;

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 240_000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "start") {
        if (i.user.id == players.at(0)) {
          if (players.size < this.properties.minPlayers) {
            await i.reply(errorEmbed("Not enough players to start."));
          } else {
            await i.deferUpdate();
          }

          collector.stop();
        } else {
          await i.reply(errorEmbed("You are not the owner of this lobby!"));
        }
      } else if (i.customId === "cancel") {
        if (i.user.id == players.at(0)) {
          const cancelledEmbed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("Connect4 game cancelled")
            .setDescription("Blame the leader");
          await response.edit({ embeds: [cancelledEmbed], components: [] });
          cancelled = true;
          collector.stop();
        } else {
          await i.reply(errorEmbed("You are not the owner of this lobby!"));
        }
      } else if (i.customId === "joinleave") {
        if (players.has(i.user.id)) {
          await i.deferUpdate();

          if (players.size == 1) {
            const cancelledEmbed = new EmbedBuilder()
              .setColor("Red")
              .setTitle("Connect4 game cancelled")
              .setDescription("Everyone left? Y'all scared?");
            await response.edit({ embeds: [cancelledEmbed], components: [] });
            cancelled = true;
            collector.stop();
          } else {
            players.delete(i.user.id);

            this.updateLobby(players, embed);
            embed.setTitle(START_TITLE + ` [${players.size}/${this.properties.maxPlayers}]`)

            await response.edit({
              embeds: [embed],
              components: [row],
            });
          }
        } else {
          if (players.size == this.properties.maxPlayers) {
            await i.reply(errorEmbed("Sorry, the lobby is full!"));
          } else {
            await i.deferUpdate();

            players.set(i.user.id, i.user);

            this.updateLobby(players, embed);
            embed.setTitle(START_TITLE + ` [${players.size}/${this.properties.maxPlayers}]`)

            await response.edit({
              embeds: [embed],
              components: [row],
            });
          }
        }
      }
    });

    collector.once("end", async (collected) => {
      if (cancelled) {
        return;
      }

      if (players.size < this.properties.minPlayers) {
        const errorEmbed = new EmbedBuilder()
          .setColor("Red")
          .setDescription("Not enough players! Game cancelled.");
        response.edit({
          embeds: [errorEmbed],
          components: [],
        });

        return;
      }

      embed.setTitle("Connect4 game: configuring...");
      response.edit({
        embeds: [embed],
        components: [],
      });

      // settings:

      let channel = interaction.channel;

      let game = await this.inputSettings(players, channel);

      if (game == "cancelled") {
        const cancelledEmbed = new EmbedBuilder()
          .setColor("Red")
          .setTitle("Connect4 game cancelled")
          .setDescription("Blame the leader");
        await response.edit({ embeds: [cancelledEmbed], components: [] });
        return;
      } else if (game == "empty") {
        const cancelledEmbed = new EmbedBuilder()
          .setColor("Red")
          .setTitle("Connect4 game cancelled")
          .setDescription("Everyone left? Y'all scared?");
        await response.edit({ embeds: [cancelledEmbed], components: [] });
        return;
      }

      embed.setTitle("Connect4 game in-progress!");
      response.edit({
        embeds: [embed],
      });

      for (var i = 0; i < game.players.size; i++) {
        players.at(i).emoji = this.defaultEmojis[i];
      }

      // Start game

      while (true) {
        if (game.turn > game.height * game.width) {
          console.log("draw");

          const drawEmbed = new EmbedBuilder()
            .setTitle("Game ended in draw!")
            .setFooter({ text: "everyone's a loser" });
          channel.send({
            embeds: [drawEmbed],
          });

          return;
        }
        await channel.send({ embeds: [this.printBoard(game)], components: [] });

        const filter = (m) =>
          m.author.id === game.players.at((game.turn + 1) % 2).id &&
          parseInt(m.content) >= 1 &&
          parseInt(m.content) <= game.width &&
          game.board[0][parseInt(m.content) - 1] == -1;

        const collected = await channel
          .awaitMessages({ filter, max: 1, time: 60_000, errors: ["time"] })
          .catch((err) => {
            channel.send("You ran out of time!");
          });

        let move = parseInt(collected.first().content) - 1;

        for (i = game.height - 1; i >= 0; i--) {
          if (game.board[i][move] == -1) {
            game.board[i][move] = game.players.at((game.turn + 1) % 2);
            break;
          }
        }

        if (this.checkWin(game) != -1) {
          const victoryEmbed = new EmbedBuilder()
            .setTitle("We have a winner!")
            .setDescription(`All hail ${this.checkWin(game)}`)
            .setColor("Green");
          await channel.send({ embeds: [victoryEmbed] });

          return;
        }

        game.turn++;
      }
    });
  },
  updateLobby(players, embed) {
    playerString = ``;
    for (i = 0; i < players.size; i++) {
      if (i == 0) {
        playerString += `${players.at(i)} - :crown:\n`;
      } else {
        playerString += `${players.at(i)}\n`;
      }
    }
    embed.setDescription(playerString);
  },

  async inputSettings(players, channel) {
    return new Promise(async (resolve, reject) => {
      let options = this.options.reduce((obj, cur) => {
        obj[cur.name] = cur.value;
        return obj;
      }, {});

      let message = await channel.send({ content: "Loading Settings" });
      const continueB = new ButtonBuilder()
        .setCustomId("continue")
        .setLabel("Continue")
        .setStyle(ButtonStyle.Primary);

      const leave = new ButtonBuilder()
        .setCustomId("leave")
        .setLabel("Leave Game")
        .setStyle(ButtonStyle.Secondary);

      const cancel = new ButtonBuilder()
        .setCustomId("cancel")
        .setLabel("Cancel Game")
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(
        continueB,
        leave,
        cancel
      );

      const settingsEmbed = new EmbedBuilder().setTitle("Options");

      let optionFilter = (m) => (m.author.id == players.at(0).id);

      optionSelecting = true;

      settingsEmbed.setDescription(
        `${this.options
          .map((option, index) => {
            return `${index + 1}. ${option.name} - **${options[option.name]}**`;
          })
          .join("\n")}\n\n${players.at(
          0
        )}, change settings by typing the option number`
      );

      await message.edit({
        content: "",
        embeds: [settingsEmbed],
        components: [row],
      });

      const bCollector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 200_000,
      });

      let oCollector = await channel.createMessageCollector({
        filter: optionFilter,
        time: 120_000,
      });

      let oFilter = (m) => true;

      bCollector.on("collect", async (i) => {
        if (i.customId === "continue") {
          if (i.user.id == players.at(0)) {
            await i.deferUpdate();
            oCollector.stop();
          } else {
            await i.reply(errorEmbed("You are not the owner of this lobby!"));
          }
        } else if (i.customId === "cancel") {
          if (i.user.id == players.at(0)) {
            collector.stop("cancelled");
          } else {
            await i.reply(errorEmbed("You are not the owner of this lobby!"));
          }
        } else if (i.customId === "leave") {
          if (players.has(i.user.id)) {
            if (players.size < this.properties.minPlayers) {
              collector.stop("empty");
              await i.deferUpdate();
            } else {
              players.delete(i.user.id);

              await i.reply(successEmbed("You are not in this lobby!"));
            }
          } else {
            await i.reply(errorEmbed("You are not in this lobby!"));
          }
        }
      });
      oCollector.on("collect", async (m) => {
        if (
          optionSelecting &&
          parseInt(m.content) >= 1 &&
          parseInt(m.content) <= this.options.length
        ) {
          oSelected = this.options[parseInt(m.content) - 1];

          

          const valueEmbed = new EmbedBuilder()
            .setTitle(`Editing ${oSelected.name}`)
            .setDescription(oSelected.desc);

          await message.edit({ embeds: [valueEmbed] });

          oFilter = (m) => oSelected.filter(m) && m.author.id == players.at(0).id;
          optionSelecting = false;
        } else if (!optionSelecting && oFilter(m)) {
          options[oSelected.name] = parseInt(m.content);

          //making sure winLength is at least minimum of width and height
          if (options.winLength > options.width && options.winLength > options.height) {
            options.winLength = Math.min(options.width, options.height);
          }

          settingsEmbed.setDescription(
            `${this.options
              .map((option, index) => {
                return `${index + 1}. ${option.name} - **${
                  options[option.name]
                }**`;
              })
              .join("\n")}\n\n${players.at(
              0
            )}, change settings by typing the option number`
          );
          await message.edit({ embeds: [settingsEmbed] });

          optionSelecting = true;
        }
      });

      oCollector.on("end", async (c, r) => {
        message.delete();
        if (r == "cancelled") {
          resolve("cancelled");
        } else if (r == "empty") {
          resolve("empty");
        } else {
          let game = this.createGame(options, players);
          resolve(game);
        }
      });
    });
  },

  emptyBoard(height, width) {
    let board = Array(height);
    for (var i = 0; i < height; i++) {
      board[i] = Array(width);
      for (var j = 0; j < width; j++) {
        board[i][j] = -1;
      }
    }

    return board;
  },

  createGame(options, players) {
    let game = {
      height: options["height"],
      width: options["width"],
      players: players,
      turn: 1,
      winLength: options["winLength"],
      board: this.emptyBoard(options["height"], options["width"]),
    };

    return game;
  },

  printBoard(game) {
    let boardText = "";
    for (var i = 0; i < game.height; i++) {
      for (var j = 0; j < game.width; j++) {
        boardText +=
          game.board[i][j] == -1 ? ":white_circle:" : game.board[i][j].emoji;
      }
      boardText += "\n";
    }
    boardText += `\n\n  ${
      game.players.at((game.turn + 1) % 2).emoji
    } - ${game.players.at((game.turn + 1) % 2)}'s turn. (Type 1-7)`;
    return new EmbedBuilder().setDescription(boardText);
  },

  checkWin(game) {
    let b = game.board;
    let wL = game.winLength;
    let h = game.height;
    let w = game.width;

    //check rows:
    for (var i = 0; i < h; i++) {
      for (var j = 0; j < w - wL + 1; j++) {
        let c = b[i][j];
        if (
          c != -1 &&
          c == b[i][j + 1] &&
          c == b[i][j + 2] &&
          c == b[i][j + 3]
        ) {
          return c;
        }
      }
    }

    for (var i = 0; i < h - wL + 1; i++) {
      for (var j = 0; j < w; j++) {
        let c = b[i][j];
        if (
          c != -1 &&
          c == b[i + 1][j] &&
          c == b[i + 2][j] &&
          c == b[i + 3][j]
        ) {
          return c;
        }
      }
    }

    //top-left bottom right diagonals
    for (var i = 0; i < h - wL + 1; i++) {
      for (var j = 0; j < w - wL + 1; j++) {
        let c = b[i][j];
        if (
          c != -1 &&
          c == b[i + 1][j + 1] &&
          c == b[i + 2][j + 2] &&
          c == b[i + 3][j + 3]
        ) {
          return c;
        }
      }
    }

    //bottom-left top right diagonals
    for (var i = wL - 1; i < h; i++) {
      for (var j = 0; j < w - wL + 1; j++) {
        let c = b[i][j];
        if (
          c != -1 &&
          c == b[i - 1][j + 1] &&
          c == b[i - 2][j + 2] &&
          c == b[i - 3][j + 3]
        ) {
          return c;
        }
      }
    }

    return -1;
  },
};

console.log("TEST");
