const Game = require("../game");

class Connect4Game extends Game {
  constructor(interaction) {
    super(interaction);

    this.properties = {
      gameName: "game",
      minPlayers: 2,
      maxPlayers: 4,
    };
    (this.defaultEmojis = [
      ":blue_circle:",
      ":red_circle:",
      ":yellow_circle:",
      ":purple_circle:",
      ":green_circle:",
      ":orange_circle:",
    ]),
      (this.options = [
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
      ]);
  }
  async playGame(channel, game) {
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
  }
  emptyBoard(height, width) {
    let board = Array(height);
    for (var i = 0; i < height; i++) {
      board[i] = Array(width);
      for (var j = 0; j < width; j++) {
        board[i][j] = -1;
      }
    }

    return board;
  }

  /**
   * Creates a new game with the specified options and players.
   *
   * @param {Object} options - The game options.
   * @param {number} options.height - The height of the game board.
   * @param {number} options.width - The width of the game board.
   * @param {number} options.winLength - The number of consecutive pieces needed to win.
   * @param {Array} players - An array of player objects.
   * @returns {Object} - The newly created game object.
   */
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
  }

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
  }

  checkWin(game) {
    //check rows:
    if (this.checkDirection(game, 1, 0) != -1)
      return this.checkDirection(game, 1, 0);

    //check columns:
    if (this.checkDirection(game, 0, 1) != -1)
      return this.checkDirection(game, 0, 1);

    //top-left bottom right diagonals
    if (this.checkDirection(game, 1, 1) != -1)
      return this.checkDirection(game, 1, 1);

    //bottom-left top right diagonals
    if (this.checkDirection(game, 1, -1) != -1)
      return this.checkDirection(game, 1, -1);

    return -1;
  }

  checkDirection(game, dX, dY) {
    let b = game.board;
    let wL = game.winLength;
    let h = game.height;
    let w = game.width;

    //make dX and dY work for any value (if I wanted to expand c4)
    //area = 1 + (winLength - 1) * d
    //example: winLength = 3, delta = 2 (there is a gap)
    //OOOXOXOX, area to check is 5 (1 + (3 - 1) * 2)
    dXA = 1 + (wL - 1) * Math.abs(dX);
    dYA = 1 + (wL - 1) * Math.abs(dY);

    // () = inclusive, [] = exclusive

    /*
        dY = 0, (0,h]
        dY = 1, (0,h-(dXA-1)]
        dy = -1, (dXA-1,h]
        dY = 2, (0,h-(dXA-1))
        */

    for (var i = dY < 0 ? dYA - 1 : 0; i < h - (dY > 0 ? dYA - 1 : 0); i++) {
      for (var j = dX < 0 ? dXA - 1 : 0; j < w - (dX > 0 ? dXA - 1 : 0); j++) {
        if (b[i][j] == -1) continue;
        for (var l = 1; l < wL; l++) {
          if (b[i + dY * l][j + dX * l] != b[i][j]) {
            break;
          } else if (l == wL - 1) {
            return b[i][j];
          }
        }
      }
    }

    return -1;
  }
}
