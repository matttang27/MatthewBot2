const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
  ComponentType,
  Collection,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("connect4")
    .setDescription("Creates a new Connect4 game"),
  async execute(interaction) {
    players = new Collection();

    players.set(interaction.user.id, interaction.user);

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("Connect4 game created!");

    this.updateLobby(players, embed);

    const start = new ButtonBuilder()
      .setCustomId("start")
      .setLabel("Start")
      .setStyle(ButtonStyle.Primary);

    const join = new ButtonBuilder()
      .setCustomId("join")
      .setLabel("Join")
      .setStyle(ButtonStyle.Secondary);

    const cancel = new ButtonBuilder()
      .setCustomId("cancel")
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(start, join, cancel);

    const response = await interaction.reply({
      embeds: [embed],
      components: [row],
    });

    cancelled = false;

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60_000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "start") {
        if (i.user.id == players.at(0)) {
          i.deferUpdate();
          collector.stop();
        } else {
          const errorEmbed = new EmbedBuilder()
            .setColor("Red")
            .setDescription("You are not the owner of this lobby!");

          await i.reply({ embeds: [errorEmbed], ephemeral: true });
        }
      } else if (i.customId === "cancel") {
        if (i.user.id == players.at(0)) {
          const errorEmbed = new EmbedBuilder()
            .setColor("Red")
            .setDescription("Game cancelled.");
          await response.edit({ embeds: [errorEmbed], components: [] });
          cancelled = true;
          collector.stop();
        } else {
          const errorEmbed = new EmbedBuilder()
            .setColor("Red")
            .setDescription("You are not the owner of this lobby!");

          await i.reply({ embeds: [errorEmbed], ephemeral: true });
        }
      } else if (i.customId === "join") {
        if (players.has(i.user.id)) {
          const errorEmbed = new EmbedBuilder()
            .setColor("Red")
            .setDescription("You are already in the lobby!");

          await i.reply({ embeds: [errorEmbed], ephemeral: true });
        } else {
          players.set(i.user.id, i.user);

          this.updateLobby(players, embed);

          await response.edit({
            embeds: [embed],
            components: [row],
          });

          i.deferUpdate();
        }
      }
    });

    collector.once("end", async (collected) => {
      if (cancelled) {
        return;
      }
      if (players.size != 2) {
        const errorEmbed = new EmbedBuilder()
          .setColor("Red")
          .setDescription("Not enough players! Game cancelled.");
        response.edit({
          embeds: [errorEmbed],
          components: [],
        });

        return;
      }

      embed.setDescription(
        `${
          players.size
        } players entered the fray!\n:blue_circle: - ${players.at(
          0
        )}\n:red_circle: - ${players.at(1)}`
      );

      response.edit({
        embeds: [embed],
        components: [],
      });

      players.at(0).emoji = ":blue_circle:";
      players.at(1).emoji = ":red_circle:";

      // Create Game

      let channel = response.interaction.channel;

      let game = this.createGame(6, 7, players);

      while (true) {
        if (game.turn > game.height * game.width) {
          console.log("draw");

          const drawEmbed = new EmbedBuilder()
            .setTitle("Game ended in draw!")
            .setFooter("everyone's a loser");
          channel.send({
            embeds: [drawEmbed],
          });

          return;
        }
        await channel.send({ embeds: [this.printBoard(game)] });

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
          const victoryEmbed = new EmbedBuilder().setTitle("We have a winner!")
          .setDescription(`All hail ${this.checkWin(game)}`)
          .setColor('Green')
          await channel.send({embeds: [victoryEmbed]});

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

  emptyBoard(height,width) {
    let board = Array(height);
    for (var i = 0; i < height; i++) {
      board[i] = Array(width);
      for (var j = 0; j < width; j++) {
        board[i][j] = -1;
      }
    }
    
    return board
  },

  createGame(height, width, players) {
    let game = {
      height: height,
      width: width,
      players: players,
      turn: 1,
      winLength: 4,
      board: this.emptyBoard(height,width),
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
    boardText += `\n\n  ${game.players.at((game.turn + 1) % 2).emoji} - ${game.players.at(
      (game.turn + 1) % 2
    )}'s turn. (Type 1-7)`;
    return new EmbedBuilder().setDescription(boardText);
  },

  checkWin(game) {

    let b = game.board;
    let wL = game.winLength;
    let h = game.height;
    let w = game.width;

    //check rows:
    for (var i = 0; i < h; i++) {
      for (var j=0;j < w - wL + 1;j++) {
        let c = b[i][j];
        if (c != -1 && c == b[i][j+1] && c == b[i][j+2] && c == b[i][j+3]) {
          return c;
        }
      }
    }

    for (var i = 0; i < h - wL + 1; i++) {
      for (var j=0;j < w;j++) {
        let c = b[i][j];
        if (c != -1 && c == b[i+1][j] && c == b[i+2][j] && c == b[i+3][j]) {
          return c;
        }
      }
    }

    //top-left bottom right diagonals
    for (var i = 0; i < h - wL + 1; i++) {
      for (var j=0;j < w - wL + 1;j++) {
        let c = b[i][j];
        if (c != -1 && c == b[i+1][j+1] && c == b[i+2][j+2] && c == b[i+3][j+3]) {
          return c;
        }
      }
    }

    //bottom-left top right diagonals
    for (var i = wL - 1; i < h; i++) {
      for (var j=0;j < w - wL + 1;j++) {
        let c = b[i][j];
        if (c != -1 && c == b[i-1][j+1] && c == b[i-2][j+2] && c == b[i-3][j+3]) {
          return c;
        }
      }
    }

    return -1;
  }
};


console.log("TEST");