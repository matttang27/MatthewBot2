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
    time,
    TimestampStyles,
} = require("discord.js");

const {
    errorEmbed,
    successEmbed,
    returnEmotes,
} = require("@root/functions.js");

const Game = require("@root/commands/games/game.js");

/**
 * Represents a Connect 4 game.
 * @extends Game
 */
class Connect4Game extends Game {
    /**
     * Creates a new Connect 4 game instance.
     * @param {Object} interaction - The interaction object from Discord.js.
     */
    constructor(interaction) {
        super(interaction);

        this.properties = {
            gameName: "Connect4",
            minPlayers: 2,
            maxPlayers: 6,
        };
        this.defaultEmojis = ["🔵", "🔴", "🟡", "🟣", "🟢", "🟠"];
        this.bannedEmojis = ["❌", "⚫", "⚪"];
        this.options = [
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
            {
                name: "timeLimit",
                label: "Time Limit (secs)",
                desc: "Enter the amount of seconds allowed per turn (5 to 120)",
                type: "num",
                value: 30,
                filter: (m) =>
                    !isNaN(m.content) &&
                    parseInt(m.content) >= 5 &&
                    parseInt(m.content) <= 120,
            },
        ];
        this.currentPlayer;
        this.turn = 1;
        this.board;
    }

    async editEmojiEmbed(embed) {
        embed.setDescription(
            `${this.players
                .map((player) => {
                    return `${player.user} - ${player.other.emoji}`;
                })
                .join("\n")}\n\n change your emoji by reacting to this message!`
        );
    }

    /**
     *
     * @returns {Promise} whether the game should continue (not cancelled)
     */
    async setup() {
        //making sure winLength is at least minimum of width and height (otherwise impossible)
        if (
            this.currentOptions.winLength > this.currentOptions.width &&
            this.currentOptions.winLength > this.currentOptions.height
        ) {
            this.currentOptions.winLength = Math.min(
                options.width,
                options.height
            );
        }

        for (var i = 0; i < this.players.size; i++) {
            this.players.at(i).other.emoji = this.defaultEmojis[i];
        }

        //Emoji selection

        return new Promise(async (resolve, reject) => {
            let message = await this.channel.send({
                content: "Selecting emojis",
            });
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

            const emojisEmbed = new EmbedBuilder().setTitle("Options");

            this.editEmojiEmbed(emojisEmbed);

            await message.edit({
                content: "",
                embeds: [emojisEmbed],
                components: [row],
            });

            const bCollector = await message.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 120_000,
            });

            const rFilter = (r, u) => {
                return this.players.has(u.id) &&
                    (!this.players
                        .map((p) => p.other.emoji)
                        .includes(r.emoji.name)) &&
                    (!this.bannedEmojis.includes(r.emoji.name));
            };

            const rCollector = await message.createReactionCollector({
                filter: rFilter,
                time: 500_000,
            });

            bCollector.on("collect", async (i) => {
                if (i.customId === "continue") {
                    if (i.user.id == this.players.at(0).user.id) {
                        bCollector.stop("continue");
                        rCollector.stop();
                        await i.deferUpdate();
                    } else {
                        await i.reply(
                            errorEmbed("You are not the owner of this lobby!")
                        );
                    }
                } else if (i.customId === "cancel") {
                    if (i.user.id == this.players.at(0).user.id) {
                        bCollector.stop("cancelled");
                        rCollector.stop();
                    } else {
                        await i.reply(
                            errorEmbed("You are not the owner of this lobby!")
                        );
                    }
                } else if (i.customId === "leave") {
                    if (this.players.has(i.user.id)) {
                        if (this.players.size == this.properties.minPlayers) {
                            bCollector.stop("not enough");
                            rCollector.stop();
                            await i.deferUpdate();
                        } else {
                            this.players.delete(i.user.id);
                            this.editEmojiEmbed(emojisEmbed);
                            await message.edit({ embeds: [emojisEmbed] });

                            await i.reply(
                                successEmbed("You are not in this lobby!")
                            );
                        }
                    } else {
                        await i.reply(errorEmbed("You are not in this lobby!"));
                    }
                }
            });

            rCollector.on("collect", async (r, u) => {
                this.players.get(u.id).other.emoji = r.emoji.toString();
                this.editEmojiEmbed(emojisEmbed);
                await message.edit({ embeds: [emojisEmbed] });
            });

            bCollector.on("end", async (c, r) => {
                message.delete();
                if (r != "continue") {
                    reject(r);
                } else {
                    this.mainEmbed.setTitle(
                        `${this.properties.gameName} game ongoing!`
                    );
                    this.response.edit({
                        embeds: [this.mainEmbed],
                        components: [],
                    });
                    resolve();
                }
            });
        });
    }

    async playGame() {
        return new Promise(async (resolve, reject) => {
            this.setEmptyBoard();

            this.currentPlayer = this.players.at(0);

            while (true) {

                if (this.winner != null) {resolve()}
                //board is full
                if (
                    this.turn >
                    this.currentOptions.height * this.currentOptions.width
                ) {
                    const drawEmbed = new EmbedBuilder()
                        .setTitle("Game ended in draw!")
                        .setFooter({ text: "everyone's a loser" });
                    this.channel.send({
                        embeds: [drawEmbed],
                    });

                    resolve();
                }

                if (this.players.size == 1) {
                    this.winner = this.players.at(0).user;
                    resolve();
                    return;
                }

                await this.channel.send({
                    embeds: [this.printBoard()],
                    components: [],
                });

                const filter = (m) =>
                    m.author.id === this.currentPlayer.user.id &&
                    parseInt(m.content) >= 1 &&
                    parseInt(m.content) <= this.currentOptions.width &&
                    this.board[0][parseInt(m.content) - 1] == -1;

                await this.channel
                    .awaitMessages({
                        filter,
                        max: 1,
                        time: this.currentOptions.timeLimit * 1000,
                        errors: ["time"],
                    })
                    .then(async (collected) => {
                        await collected.first().delete();
                        
                        let move = parseInt(collected.first().content) - 1;

                        for (
                            var i = this.currentOptions.height - 1;
                            i >= 0;
                            i--
                        ) {
                            if (this.board[i][move] == -1) {
                                this.board[i][move] = this.currentPlayer.user.id;
                                break;
                            }
                        }

                        if (this.checkWin() != -1) {
                            this.winner = this.players.get(this.checkWin()).user;
                            
                        } else {
                            this.currentPlayer = this.players.at(
                                (Array.from(this.players)
                                    .map((p) => p[0])
                                    .indexOf(this.currentPlayer.user.id) +
                                    1) %
                                    this.players.size
                            );
    
                            this.turn++;
                        }

                        
                    })
                    .catch(async (collected) => {
                        await this.channel.send(
                            `<@${this.currentPlayer.user.id}> ran out of time!`
                        );

                        let quitter = this.currentPlayer.user.id;

                        //gets the next player in the collection (wraps around if last)
                        this.currentPlayer = this.players.at(
                            (Array.from(this.players)
                                .map((p) => p[0])
                                .indexOf(this.currentPlayer.user.id) +
                                1) %
                                this.players.size
                        );
                        //then delete original player
                        this.players.delete(quitter);
                    });
            }
        });
    }
    /**
     * Initializes an empty game board.
     */
    setEmptyBoard() {
        let board = Array(this.currentOptions.height);
        for (var i = 0; i < this.currentOptions.height; i++) {
            board[i] = Array(this.currentOptions.width);
            for (var j = 0; j < this.currentOptions.width; j++) {
                board[i][j] = -1;
            }
        }

        this.board = board;
    }

    /**
     * Generates a visual representation of the game board.
     * @returns {EmbedBuilder} The embed representing the game board.
     */
    printBoard() {
        let boardText = "";
        for (var i = 0; i < this.currentOptions.height; i++) {
            for (var j = 0; j < this.currentOptions.width; j++) {
                if (this.board[i][j] == -1) {
                    boardText += "⚪";
                }
                //For deleted players who timed out, put black circle
                else if (!this.players.has(this.board[i][j])) {
                    boardText += "⚫";
                } else {
                    boardText += this.players.get(this.board[i][j]).other.emoji;
                }
            }
            boardText += "\n";
        }
        boardText += `\n\n  ${this.currentPlayer.other.emoji} - <@${
            this.currentPlayer.user.id
        }>'s turn. (Type 1-7) ${time(
            Math.round(
                (Date.now() + this.currentOptions.timeLimit * 1000) / 1000
            ),
            "R"
        )}`;
        return new EmbedBuilder().setDescription(boardText);
    }

    /**
     * Checks if there is a winning condition on the board.
     * @returns {number|Object} The winning player or -1 if no winner.
     */
    checkWin() {
        //check rows:
        if (this.checkDirection(1, 0) != -1) return this.checkDirection(1, 0);

        //check columns:
        if (this.checkDirection(0, 1) != -1) return this.checkDirection(0, 1);

        //top-left bottom right diagonals
        if (this.checkDirection(1, 1) != -1) return this.checkDirection(1, 1);

        //bottom-left top right diagonals
        if (this.checkDirection(1, -1) != -1) return this.checkDirection(1, -1);

        return -1;
    }

    /**
     * Checks a specific direction for a winning sequence.
     * @param {number} dX - The change in X direction.
     * @param {number} dY - The change in Y direction.
     * @returns {number|Object} The winning player or -1 if no winner.
     */
    checkDirection(dX, dY) {
        let b = this.board;
        let wL = this.currentOptions.winLength;
        let h = this.currentOptions.height;
        let w = this.currentOptions.width;

        //make dX and dY work for any value (if I wanted to expand c4)
        //area = 1 + (winLength - 1) * d
        //example: winLength = 3, delta = 2 (there is a gap)
        //OOOXOXOX, area to check is 5 (1 + (3 - 1) * 2)
        let dXA = 1 + (wL - 1) * Math.abs(dX);
        let dYA = 1 + (wL - 1) * Math.abs(dY);

        // () = inclusive, [] = exclusive

        /*
        dY = 0, (0,h]
        dY = 1, (0,h-(dXA-1)]
        dy = -1, (dXA-1,h]
        dY = 2, (0,h-(dXA-1))
        */

        for (
            var i = dY < 0 ? dYA - 1 : 0;
            i < h - (dY > 0 ? dYA - 1 : 0);
            i++
        ) {
            for (
                var j = dX < 0 ? dXA - 1 : 0;
                j < w - (dX > 0 ? dXA - 1 : 0);
                j++
            ) {
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

module.exports = Connect4Game;
