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
    CommandInteraction,
    User,
    Embed,
    InteractionResponse,
    TextChannel,
    Message,
} = require("discord.js");

const { errorEmbed, successEmbed, returnEmotes } = require("@root/functions");
const MatthewClient = require("@root/matthewClient");

/**
 * This class handles the setup, configuration, and execution of a multiplayer game within a Discord server.
 * It manages player interactions, game settings, and various game stages such as the lobby, in-game play, and the win screen.
 * 
 */
class Game {
    /**
     * 
     * @param {CommandInteraction} interaction - The interaction that initiated the game.
     */
    constructor(interaction) {
        this.properties = {
            gameName: "game",
            minPlayers: 2,
            maxPlayers: 4,
        };
        this.options = [
            {
                name: "example",
                label: "Example setting",
                desc: "This is an example",
                type: "num",
                value: 5,
                filter: (m) =>
                    !isNaN(m.content) &&
                    parseInt(m.content) >= 2 &&
                    parseInt(m.content) <= 20,
            },
        ];
        /**
         * @type {Object} - Holds the current game options as set by the user.
         */
        this.currentOptions = {};

        /** @type {MatthewClient}*/
        this.client = interaction.client

        /** @type {CommandInteraction} */
        this.interaction = interaction;

        /** @type {TextChannel}*/
        this.channel = interaction.channel;

        /**
         * The main response message
         * @type {Message}
         */
        this.mainResponse;


        /**
         * The embed in the main response message (shows list of players)
         * @type {EmbedBuilder}
         */
        this.mainEmbed = new EmbedBuilder().setColor("Green")

        /**
         * The embed for stages (ex. options list)
         * @type {EmbedBuilder}
         */
        this.stageEmbed = new EmbedBuilder();

        /**
         * @type {Date} - The timestamp when the game started.
         */
        this.startTime = new Date(Date.now());

        /**
            * @type {Object}
            * The properties to edit the mainResponse with
            */
        this.responseBody = {content: null};

        /**
         * @type {Collection<string, { user: User, stats: Object, other: Object }>}
         */
        this.players = new Collection().set(interaction.user.id, {
            user: interaction.user,
            stats: {},
            other: {},
        });

        

        /**
         * @type {string} - The current phase of the game (e.g., lobby, settings, in-game).
         */
        this.phase = "";

        /**
         * @type {User|null}
         */
        this.winner = null;

        /** @type {[{name: string, embedTitle: string, execute: function(), stageEmbed: boolean}]} */
        this.stages = [
            {
                name: "lobby",
                embedTitle: "game created!",
                stageEmbed: false,
                execute: () => this.lobby()
            },
            {
                name: "settings",
                embedTitle: "game configuring...",
                stageEmbed: true,
                execute: () => this.inputSettings()
            },
            {
                name: "ingame",
                embedTitle: "game ongoing!",
                stageEmbed: true,
                execute: () => this.playGame()
            },
            {
                name: "winScreen",
                embedTitle: "game finished",
                stageEmbed: false,
                execute: () => this.winScreen()
            }
        ]

        this.errMessages = {
            "cancelled": "Blame the leader",
            "empty": "Everyone left? Y'all scared?",
            "not enough": "Not enough players! Fake friends fr",
            "time": "Make sure to press the button!"
        };
    }
    //TODO: Combine both lobby list and other responses into one message (why didn't I think of this earlier??)
    //GOALS: Limit the amount of message updates / creates (costs time / complexity)
    //       but make code as clear as possible, and reduce repetitiveness.
    
    /**
     * Creates and starts the game, executing all stages in this.stages sequentially.
     */
    async create() {
        try {
            this.mainResponse = await this.interaction.reply({content: "Loading...", fetchReply: true});

            this.client.games.set(this.client.games.size,this);

            for (var i in this.stages) {
                this.stage = this.stages[i];
                this.responseBody.embeds = this.stage.stageEmbed ? [this.mainEmbed,this.stageEmbed] : [this.mainEmbed]
                await this.updateLobby();
                await this.stages[i].execute();
            }

        } catch (err) {
           this.handleCancellation(err);
        }
    }

    async handleCancellation(err) {
        const cancelledEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle(`${this.properties.gameName} game cancelled`);

        if (! (err in this.errMessages)) {
            console.error(err);
            return;
            
        }

        cancelledEmbed.setDescription(this.errMessages[err]);
        await this.mainResponse.edit({
            embeds: [cancelledEmbed],
            components: [],
        });
    }

    /**
     * Updates the lobby by modifying the mainEmbed description to display the list of current players.
     * @param {boolean} edit - whether to edit the mainResponse message immediately.
     */

    async updateLobby(edit = false) {
        let playerString = ``;
        for (var i = 0; i < this.players.size; i++) {
            if (i == 0) {
                playerString += `${this.players.at(i).user} - :crown:\n`;
            } else {
                playerString += `${this.players.at(i).user}\n`;
            }
        }
        this.mainEmbed.setDescription(playerString);

        this.mainEmbed.setTitle(`${this.properties.gameName} ${this.stage.embedTitle}` + 
            (this.stage.name === "lobby" ? ` [${this.players.size}/${this.properties.maxPlayers}]` : ""));

        if (edit) {
            await this.mainResponse.edit(this.responseBody)
        };
    }

    /**
     * Manages the lobby phase, where players can join or leave, and the game owner can start or cancel the game.
     * 
     * @returns {Promise} Resolves if the lobby was successful, otherwise rejects with a reason.
     */
    async lobby() {
        return new Promise(async (resolve, reject) => {

            const startButton = new ButtonBuilder().setCustomId("start").setLabel("Start").setStyle(ButtonStyle.Primary);
            const joinButton = new ButtonBuilder().setCustomId("joinleave").setLabel("Join / Leave").setStyle(ButtonStyle.Secondary);
            const cancelButton = new ButtonBuilder().setCustomId("cancel").setLabel("Cancel").setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(startButton,joinButton,cancelButton);

            this.responseBody.components = [row];
            await this.mainResponse.edit(this.responseBody);

            const collector = this.mainResponse.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 120_000,
            });

            collector.on("collect", async (i) => {
                
                if (i.customId === "start") {
                    if (i.user.id == this.players.at(0).user.id) {
                        if (this.players.size < this.properties.minPlayers) {
                            await i.reply(
                                errorEmbed(`Not enough players to start. (Minimum ${this.properties.minPlayers} players)`)
                            );
                        } else {
                            await i.deferUpdate();
                            collector.stop();
                        }
                    } else {
                        await i.reply(
                            errorEmbed("You are not the owner of this lobby!")
                        );
                    }
                } else if (i.customId === "cancel") {
                    if (i.user.id == this.players.at(0).user.id) {
                        await i.deferUpdate();
                        collector.stop("cancelled");
                    } else {
                        await i.reply(
                            errorEmbed("You are not the owner of this lobby!")
                        );
                    }
                } else if (i.customId === "joinleave") {
                    await i.deferUpdate();
                    if (this.players.has(i.user.id)) {
                        

                        this.players.delete(i.user.id);
                        
                        if (this.players.size == 0) {
                            collector.stop("empty");
                        } else {
                            await this.updateLobby(true);
                        }
                    } else {
                        if (this.players.size == this.properties.maxPlayers) {
                            await i.reply(
                                errorEmbed("Sorry, the lobby is full!")
                            );
                        } else {
                            this.players.set(i.user.id, {user: i.user, stats: {}, other: {}});

                            await this.updateLobby(true);
                            
                        }
                    }
                }
            });

            collector.once("end", async (collected, reason) => {
                if (reason == "cancelled" || reason == "empty") {
                    reject(reason);
                    return;
                }

                if (this.players.size < this.properties.minPlayers) {
                    reject("not enough");
                    return;
                }

                resolve();
            });
        });
    }

    /**
     * Edits this.stageEmbed to show the list of options.
     * @param {boolean} edit - whether to edit the mainResponse message immediately.
    */
    async showOptionsList(edit=false) {
        this.stageEmbed.setDescription(
            `${this.options
                .map((option, index) => {
                    return `${index + 1}. ${option.label} - **${
                        this.currentOptions[option.name]
                    }**`;
                })
                .join("\n")}\n\n${this.players.at(
                0
            ).user}, change settings by typing the option number`
        );
        if (edit) { await this.mainResponse.edit(this.responseBody)};
    }
    /**
     * Handles the settings input phase, allowing the game owner to configure game settings.
     * 
     * @returns {Promise} Resolves if the settings were successfully configured, otherwise rejects.
     */
    async inputSettings() {
        return new Promise(async (resolve, reject) => {
            this.currentOptions = this.options.reduce((obj, cur) => {
                obj[cur.name] = cur.value;
                return obj;
            }, {});

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

            this.responseBody.components = [new ActionRowBuilder().addComponents(
                continueB,
                leave,
                cancel
            )];

            this.stageEmbed.setTitle("Options")

            var optionSelecting = true;

            /** Edits the options message description to show the list of options, asking the owner to select one.*/
            await this.showOptionsList();

            await this.mainResponse.edit(this.responseBody)

            

            const bCollector = await this.mainResponse.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 120_000,
            });

            let optionFilter = (m) => m.author.id == this.players.at(0).user.id;

            const oCollector = await this.channel.createMessageCollector({
                filter: optionFilter,
                time: 500_000,
            });

            

            let oFilter = (m) => m.author.id == this.players.at(0).user.id;

            let oSelected;

            bCollector.on("collect", async (i) => {
                if (i.customId === "continue") {
                    if (i.user.id == this.players.at(0).user.id) {
                        bCollector.stop("continue");
                        oCollector.stop();
                        await i.deferUpdate();
                    } else {
                        await i.reply(
                            errorEmbed("You are not the owner of this lobby!")
                        );
                    }
                } else if (i.customId === "cancel") {
                    if (i.user.id == this.players.at(0).user.id) {
                        bCollector.stop("cancelled");
                        oCollector.stop();
                    } else {
                        await i.reply(
                            errorEmbed("You are not the owner of this lobby!")
                        );
                    }
                } else if (i.customId === "leave") {
                    if (this.players.has(i.user.id)) {
                        await i.deferUpdate()
                        this.players.delete(i.user.id);


                        if (this.players.size < this.properties.minPlayers) {
                            bCollector.stop("not enough");
                            oCollector.stop();
                            
                        } else {
                        

                            if (optionSelecting) {
                                await this.showOptionsList();
                            }
                            
                            await this.updateLobby(true);
                        }
                    } else {
                        await i.reply(errorEmbed("You are not in this lobby!"));
                    }
                }
            });

            bCollector.on("end", async (c, r) => {
                if (r != "continue") {
                    reject(r);
                } else {
                    resolve();
                }
            });

            oCollector.on("collect", async (m) => {
                if (
                    optionSelecting &&
                    parseInt(m.content) >= 1 &&
                    parseInt(m.content) <= this.options.length
                ) {
                    await m.delete();
                    oSelected = this.options[parseInt(m.content) - 1];

                    this.stageEmbed
                        .setTitle(`Editing ${oSelected.label}`)
                        .setDescription(oSelected.desc);

                    await this.mainResponse.edit(this.responseBody);

                    oFilter = (m) =>
                        oSelected.filter(m) &&
                        m.author.id == this.players.at(0).user.id;
                    
                    optionSelecting = false;

                } else if (!optionSelecting && oFilter(m)) {
                    await m.delete();
                    this.currentOptions[oSelected.name] = parseInt(m.content);

                    await this.showOptionsList(true);

                    optionSelecting = true;
                }
            });
        });
    }
    /**
     * Executes the main gameplay loop.
     * This method should be implemented by extending classes to handle the core game logic.
     */
    playGame() {

        /*replace with game*/
        return new Promise(async (resolve, reject) => {

            this.stageEmbed.setTitle("Game")
            this.stageEmbed.setDescription("Ending in 5 seconds...")

            this.mainResponse.edit(this.responseBody);

            await new Promise(r => setTimeout(r,5000));
            this.winner = this.players.at(0).user;

            
            resolve();
        });
    }

    /**
     * Displays the win screen with the winner's details.
     */
    async winScreen() {
        this.responseBody.components = [];
        await this.mainResponse.edit(this.responseBody);
        
        if (this.winner != null) {
            const victoryEmbed = new EmbedBuilder()
                .setTitle("We have a winner!")
                .setDescription(`All hail ${this.winner}`)
                .setColor("Green");
            await this.channel.send({ embeds: [victoryEmbed] });
        } else {
            const noVictoryEmbed = new EmbedBuilder()
                .setTitle("There was no winner...")
                .setDescription(`Everyone's a loser.`)
                .setColor("Red");
            await this.channel.send({ embeds: [noVictoryEmbed] });
            resolve();
        }
        
    }
}

module.exports = Game;
