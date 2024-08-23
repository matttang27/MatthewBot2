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
    ButtonInteraction,
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
     * Initializes a new game instance.
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
         * The actionrow for buttons
         * @type {ActionRowBuilder}
         */
        this.buttons = new ActionRowBuilder().setComponents(
            new ButtonBuilder().setCustomId("start").setLabel("Start").setStyle(ButtonStyle.Primary)
            ,new ButtonBuilder().setCustomId("joinleave").setLabel("Join / Leave").setStyle(ButtonStyle.Secondary)
            ,new ButtonBuilder().setCustomId("cancel").setLabel("Cancel").setStyle(ButtonStyle.Danger)
        );

        /**
         * The collector for those buttons
         * @type {InteractionCollector<ButtonInteraction>}
         */
        this.buttonCollector;
        

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
         * @type {User|null}
         */
        this.winner = null;

        /** @type {[{name: string, embedTitle: string, execute: function(), stageEmbed: boolean, canJoin: boolean, buttons: boolean}]} */
        this.stages = [
            {
                name: "lobby",
                embedTitle: "game created!",
                stageEmbed: false,
                buttons: true,
                canJoin: true,
                execute: () => this.lobby()
            },
            {
                name: "settings",
                embedTitle: "game configuring...",
                stageEmbed: true,
                buttons: true,
                canJoin: false,
                execute: () => this.inputSettings()
            },
            {
                name: "ingame",
                embedTitle: "game ongoing!",
                stageEmbed: true,
                buttons: false,
                canJoin: false,
                execute: () => this.playGame()
            },
            {
                name: "winScreen",
                embedTitle: "game finished",
                stageEmbed: false,
                canJoin: false,
                buttons: false,
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
                if (this.stage.buttons === true) {
                    await this.setupButtons();
                }
                await this.updateLobby();
                await this.stages[i].execute();
            }

        } catch (err) {
           this.handleCancellation(err);
        }
    }

    /**
     * Handles the cancellation of the game.
     * 
     * @param {string} err - The reason for the cancellation.
     */
    async handleCancellation(err) {
        console.error(err);

        if (! (err in this.errMessages)) {
            return
        }

        const cancelledEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle(`${this.properties.gameName} game cancelled`);
        cancelledEmbed.setDescription(this.errMessages[err]);
        await this.mainResponse.edit({
            embeds: [cancelledEmbed],
            components: [],
        });
    }

    /**
     * Sets up buttons for the current stage of the game.
     */
    async setupButtons() {
        this.buttons.setComponents(
            new ButtonBuilder().setCustomId("continue").setLabel(this.stage.name === "lobby" ? "Start" : "Continue").setStyle(ButtonStyle.Primary)
            ,new ButtonBuilder().setCustomId("joinleave").setLabel(this.stage.name === "lobby" ? "Join / Leave" : "Leave Game").setStyle(ButtonStyle.Secondary)
            ,new ButtonBuilder().setCustomId("cancel").setLabel(this.stage.name === "lobby" ? "Cancel" : "Cancel Game").setStyle(ButtonStyle.Danger)
        );

        this.responseBody.components = [this.buttons];
    }

    /**
     * Creates button collectors to handle button interactions for the current stage.
     * 
     * @param {Function} updateStage - Function to update the stage when required.
     * @returns {Promise<void>} Resolves when the button collector ends.
     */
    async createButtonCollectors(updateStage) {

        this.buttonCollector = this.mainResponse.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 120_000,
        });

        this.buttonCollector.on("collect", async (i) => {
                
            if (i.customId === "continue") {
                if (i.user.id == this.players.at(0).user.id) {
                    
                    if (this.players.size < this.properties.minPlayers) {
                        //this can only occur during lobby stages
                        await i.reply(
                            errorEmbed(`Not enough players to continue. (Minimum ${this.properties.minPlayers} players)`)
                        );
                    } else {
                        await i.deferUpdate();
                        this.buttonCollector.stop();
                    }
                } else {
                    await i.reply(
                        errorEmbed("You are not the owner of this lobby!")
                    );
                }
            } else if (i.customId === "cancel") {
                if (i.user.id == this.players.at(0).user.id) {
                    await i.deferUpdate();
                    this.buttonCollector.stop("cancelled");
                } else {
                    await i.reply(
                        errorEmbed("You are not the owner of this lobby!")
                    );
                }
            } else if (i.customId === "joinleave") {
                if (this.players.has(i.user.id)) {
                    await i.deferUpdate();

                    this.players.delete(i.user.id);
                    
                    if (this.players.size == 0) {
                        this.buttonCollector.stop("empty");
                    } else if (this.stage.canJoin !== true && this.players.size < this.properties.minPlayers) {
                        this.buttonCollector.stop("not enough")
                    } else {
                        await updateStage();
                        await this.updateLobby(true);
                        
                    }
                } else {
                    if (! this.stage.canJoin) {
                        await i.reply(errorEmbed("You are not in this lobby!"));
                    } else if (this.players.size == this.properties.maxPlayers) {
                        await i.reply(errorEmbed("Sorry, the lobby is full!"));
                    } else {
                        await i.deferUpdate();
                        this.players.set(i.user.id, {user: i.user, stats: {}, other: {}});

                        await updateStage();
                        await this.updateLobby(true);
                        
                    }
                }
            }
        });

        await new Promise((resolve, reject) => {
            this.buttonCollector.on('end', async (c,r) => {
                if (r != 'user') {
                    reject(r)
                } else {
                    resolve();
                }
            })
        })
        
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

        this.mainEmbed.setTitle(`${this.properties.gameName} ${this.stage.embedTitle}` + 
            (this.stage.canJoin ? ` [${this.players.size}/${this.properties.maxPlayers}]` : ""));
        this.mainEmbed.setDescription(playerString);

        

        if (edit) {
            await this.mainResponse.edit(this.responseBody)
        };
    }

    /**
     * Manages the lobby phase, where players can join or leave, and the game owner can start or cancel the game.
     * 
     * Resolves if the lobby was successful, otherwise rejects with a reason.
     */
    async lobby() {
        await this.mainResponse.edit(this.responseBody)
        await this.createButtonCollectors(() => {});
    }

    /**
     * Edits this.stageEmbed to show the list of options.
     * @param {boolean} edit - whether to edit the mainResponse message immediately.
    */
    async showOptionsList(edit=false) {
        this.stageEmbed.setTitle("Options")
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
     * @returns {Promise<void>} Resolves if the settings were successfully configured, otherwise rejects.
     */
    async inputSettings() {
        /** @type {MessageCollector} */
        let oCollector;
        try {
            this.currentOptions = this.options.reduce((obj, cur) => {
                obj[cur.name] = cur.value;
                return obj;
            }, {});
    
            var optionSelecting = true;
    
            /** Edits the options message description to show the list of options, asking the owner to select one.*/
            await this.showOptionsList(true);
    
            let optionFilter = (m) => m.author.id == this.players.at(0).user.id;
    
            oCollector = await this.channel.createMessageCollector({
                filter: optionFilter,
                time: 500_000,
            });
    
            let oFilter = (m) => m.author.id == this.players.at(0).user.id;
    
            let oSelected;
    
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

            await this.createButtonCollectors(() => {
                if (this.stageEmbed.data.title == "Options") {
                    this.showOptionsList();
                }
            })
            
        } catch (err) {
            throw err;
        } finally {
            if (oCollector) {oCollector.stop()};
        }
        
    }
    /**
     * Executes the main gameplay loop.
     * This method should be implemented by extending classes to handle the core game logic.
     */
    async playGame() {

        this.stageEmbed.setTitle("Game")
        this.stageEmbed.setDescription("Ending in 5 seconds...")

        this.mainResponse.edit(this.responseBody);

        await new Promise(r => setTimeout(r,5000));
        this.winner = this.players.at(0).user;

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
        }
        
    }
}

module.exports = Game;
