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
    User,
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
    constructor(interaction,options={}) {
        super(interaction,options);

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
            {
                name: "gamemode",
                label: "Gamemode",
                desc: 
                `Enter the number of the gamemode you would like to play:
                \n1. Original - The classic connect4.
                \n2. Colorblind - Pieces are all identical. Can you remember them all?
                \n3. Blind - The board is not shown. For the brave.
                \n4. Dizzy - Every move, the piece is inserted from a different side (rotating clockwise)`,
                type: "selection",
                selections: ["Original","Colorblind","Blind","Dizzy"],
                value: "Original",
                filter: (m) =>
                    !isNaN(m.content) &&
                    parseInt(m.content) >= 1 &&
                    parseInt(m.content) <= 5,
            }
        ];
        
        this.currentPlayer;
        /** @type {Array<Array<number>>} */
        this.board;
        /** @type {Array<[number,number,number]} */
        this.moves = [];

        this.stages["emojis"] = {
            name: "emojis",
            embedTitle: "game setting emojis...",
            stageEmbed: true,
            buttons: true,
            canJoin: false,
            execute: () => this.setEmojis()
        }

        this.stages["ingame"].customPlayerStatus = (i) => {
            if (this.players.at(i).other.alive) {
                return `${this.players.at(i).user}\n`
            } else {
                return `~~${this.players.at(i).user}~~\n`
            }
        }

        this.stageMap = ["lobby","options","emojis","ingame","winScreen"]

        this.playerAddAction = (i) => {
            this.players.set(i.user.id,{user: i.user, stats: {}, other: {alive: true}})

            for (var i = 0; i < this.players.size; i++) {
                this.players.at(i).other.emoji = this.defaultEmojis[i];
            }
        }

        /**
         * Represents the winner of the Connect4 game.
         * 
         * - `null` if the game is still ongoing or no winner has been determined yet.
         * - A `User` object representing the player who won the game.
         * - `"boardFull"` if the game ended in a draw with the board completely filled.
         * - `"rotateBoardFull"` if the game ended because the board could not rotate to a valid state.
         * 
         * @type {null | User | "boardFull" | "rotateBoardFull"}
         */
        this.winner = null;

    }

    async editEmojiEmbed(edit) {
        this.stageEmbed.setTitle("Choose your piece!")
        this.stageEmbed.setDescription(
            `${this.players
                .map((player) => {
                    return `${player.user} - ${player.other.emoji}`;
                })
                .join("\n")}\n\n change your piece by reacting to this message!`
        );

        if (edit) {
            await this.mainResponse.edit(this.responseBody)
        };
    }

    /**
     *
     * @returns {Promise<void>} whether the game should continue (not cancelled)
     */
    async setEmojis() {

        if (["Colorblind","Blind"].includes(this.currentOptions.gamemode)) return;
        let rCollector;
        try {
    
            await this.editEmojiEmbed(true);
    
            const rCollector = await this.mainResponse.createReactionCollector({
                filter: (r,u) => true,
                time: 500_000,
            });
    
            rCollector.on("collect", async (r, u) => {
                if (this.players.has(u.id) &&
                    (!this.players.map((p) => p.other.emoji).includes(r.emoji.name)) &&
                    (!this.bannedEmojis.includes(r.emoji.name))) {
                    this.players.get(u.id).other.emoji = r.emoji.toString();
                    this.editEmojiEmbed(true);
                } else {
                    r.users.remove(u);
                }
                
                
            });
    
            await this.createButtonCollectors(this.editEmojiEmbed);
        } catch (err) {
            throw err
        } finally {
            if (rCollector) {rCollector.stop();}
        }
        
    }

    /**
     * For Dizzy gamemode: Checks if the board sides are all full (since then no one can play)
     */
    rotateBoardFull() {
        for (var i=0;i<this.currentOptions.width;i++) {
            //top row & bottom row
            if (this.board[0][i] != -1 || this.board[this.currentOptions.height - 1][i] != 1) {
                return false;
            }
        }
        for (var j=0;j<this.currentOptions.height;j++) {
            //left column & right column
            if (this.board[j][0] != -1 || this.board[j][this.currentOptions.width - 1] != -1) {
                return false;
            }
        }
        return true;
    }

    /**
     * For Dizzy gamemode: Rotates the board clockwise until there is an available move
     * WARNING: Infinite loop if board is full.
     */
    rotateBoard() {

        let newBoard = this.board[0].map((val, index) => this.board.map(row => row[index]).reverse())
        this.board = newBoard;
        
        [this.currentOptions.width, this.currentOptions.height] = [this.currentOptions.height, this.currentOptions.width]
        for (var i=0;i<this.moves.length;i++) {
            let temp = this.moves[i][1];
            this.moves[i][1] = this.moves[i][2];
            this.moves[i][2] = this.currentOptions.width - temp - 1;
        }

        //check if there is valid move
        let valid = false;
        for (var i=0;i<this.currentOptions.width;i++) {
            if (this.board[0][i] == -1) {
                valid = true;
            }
        }

        if (!valid) {
            this.rotateBoard();
        }
    }


    async goNextPlayer() {
        let index = Array.from(this.players.keys()).findIndex(s => s == this.currentPlayer.user.id)
        while (true) {
            index = (index + 1) % this.players.size;
            if (this.players.at(index).other.alive) {
                this.currentPlayer = this.players.at(index);
                return;
            }
        }
    }
    
    async playGame() {
        //making sure winLength is at least minimum of width and height (otherwise impossible)
        if (
            this.currentOptions.winLength > this.currentOptions.width &&
            this.currentOptions.winLength > this.currentOptions.height
        ) {
            this.currentOptions.winLength = Math.min(
                this.currentOptions.width,
                this.currentOptions.height
            );
        }

        this.setEmptyBoard();

        this.currentPlayer = this.players.first();

        this.stageEmbed.setTitle(null);

        while (true) {
            if (this.winner != null) {
                if (this.moves.length == this.currentOptions.height * this.currentOptions.width) {
                    this.winner = "boardFull"
                } else if (this.currentOptions.gamemode == "Dizzy" && this.rotateBoardFull()) {
                    this.winner = "rotateBoardFull"
                }
            }

            //rotates the board and moves if gamemode is Dizzy
            if (this.currentOptions.gamemode == "Dizzy" && this.winner == null) {
                this.rotateBoard();
            }
            
        
            await this.printBoard(true);

            if (this.winner != null) {return}            

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
                .then(async (collected,reason) => {
                    await collected.first().delete();
                    
                    let move = parseInt(collected.first().content) - 1;
                    
                    if (this.currentOptions.gamemode == "Dizzy") {
                        for (var i = 0; i < this.currentOptions.height; i++) {
                            if (i == this.currentOptions.height - 1 || this.board[i+1][move] != -1) {
                                this.board[i][move] = this.currentPlayer.user.id;
                                this.moves.push([this.currentPlayer.user.id,i,move])
                                break;
                            }
                        }
                    } else {
                        for (var i = this.currentOptions.height - 1;i >= 0;i--) {
                            if (this.board[i][move] == -1) {
                                this.board[i][move] = this.currentPlayer.user.id;
                                this.moves.push([this.currentPlayer.user.id,i,move])
                                break;
                            }
                        }
                    }
                    

                    if (this.checkWin() != -1) {
                        this.winner = this.players.get(this.checkWin()).user;
                        
                    } else {
                        this.goNextPlayer();

                        this.turn++;
                    }

                    
                })
                .catch(async (collected,reason) => {
                    await this.channel.send(
                        `<@${this.currentPlayer.user.id}> ran out of time!`
                    );

                    

                    this.currentPlayer.other.alive = false;
                    this.updateStatus();

                    if (this.players.filter((player) => player.other.alive === true).size == 1) {
                        this.winner = this.players.find((player) => player.other.alive === true).user;
                    }

                    this.goNextPlayer();
                    
                    
                });
        }
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
     * @param {boolean} edit - whether to edit the mainResponse message immediately.
     */
    async printBoard(edit) {
        let boardText = "";

        if (this.moves.length >= 1) {
            let lastMove = this.moves[this.moves.length - 1]
            boardText += `<@${lastMove[0]}> moved: (${lastMove[2] + 1},${lastMove[1] + 1}) - ((1,1) is top left)\n\n`
        }

        
        for (var i = 0; i < this.currentOptions.height; i++) {
            for (var j = 0; j < this.currentOptions.width; j++) {
                if (this.board[i][j] == -1 || (this.currentOptions.gamemode == "Blind" && this.winner == null)) {
                    boardText += "⚪";
                }
                //For dead players who timed out, put black circle
                else if (! this.players.get(this.board[i][j]).other.alive || (this.currentOptions.gamemode == "Colorblind" && this.winner == null)) {
                    boardText += "⚫";
                } else {
                    boardText += this.players.get(this.board[i][j]).other.emoji;
                }
            }
            boardText += "\n";
        }
        

        if (this.winner != null) {
            boardText += `\n\n  ${this.players.get(this.winner.id).other.emoji} - <@${this.currentPlayer.user.id}> has won!`
        } else if (this.winner == "boardFull" || this.winner == "rotateBoardFull") {
            boardText += `Board is full. It's a draw!`
        } else {
            boardText += `\n\n  ${this.currentPlayer.other.emoji} - <@${
                this.currentPlayer.user.id
            }>'s turn. (Type 1-${this.currentOptions.width}) ${time(
                Math.round(
                    (Date.now() + this.currentOptions.timeLimit * 1000) / 1000
                ),
                "R"
            )}`;
        }
        

        this.stageEmbed.setDescription(boardText);

        if (edit) {await this.mainResponse.edit(this.responseBody)};
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

    createNewGame(interaction) {
        new Connect4Game(interaction,this.currentOptions).create();
    }
}

module.exports = Connect4Game;
