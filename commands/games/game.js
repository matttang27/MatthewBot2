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
 * It manages player interactions, game options, and various game stages such as the lobby, in-game play, and the win screen.
 * 
 */
class Game {
    /**
     * Initializes a new game instance.
     * 
     * @param {CommandInteraction} interaction - The interaction that initiated the game.
     * @param {Object} options - The options for the game
     */
    constructor(interaction,currentOptions={}) {
        this.properties = {
            gameName: "game",
            minPlayers: 2,
            maxPlayers: 4,
        };

        /** @type {Array<{name: string, label: string, desc: string, type: string, value: any, filter: function(Message) => boolean}>} */
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
        this.currentOptions = currentOptions;

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
        this.statusEmbed = new EmbedBuilder().setColor("Green")

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
         * The actions to do when a player is added to the game (for example, setting a default emoji)
         * @type {function(number): any} the userid of the user added.
         */
        this.playerAddAction;

        /**
         * @type {User|null}
         */
        this.winner = null;

        /** 
         * @type {Object.<string, {name: string, embedTitle: string, setup?: function(), execute?: function(), customPlayerStatus?: (number) => string, stageEmbed?: boolean, canJoin?: boolean, buttons?: boolean}>}
         */
        this.stages = {
            lobby: {
                name: "lobby",
                embedTitle: "game created!",
                stageEmbed: false,
                buttons: true,
                canJoin: true,
                execute: () => this.lobbyStage()
            },
            options: {
                name: "options",
                embedTitle: "game configuring...",
                stageEmbed: true,
                buttons: true,
                canJoin: false,
                execute: () => this.optionsStage()
            },
            ingame: {
                name: "ingame",
                embedTitle: "game ongoing!",
                stageEmbed: true,
                buttons: false,
                canJoin: false,
                customPlayerStatus: (i) => `${this.players.at(i).user}\n`,
                execute: () => this.playGame()
            },
            winScreen: {
                name: "winScreen",
                embedTitle: "game finished",
                stageEmbed: true,
                canJoin: false,
                buttons: false,
                customPlayerStatus: (i) => {
                    if (this.winner === this.players.at(i).user) {
                        return `***${this.players.at(i).user} - ***:trophy:\n`
                    } else {
                        return `${this.players.at(i).user}\n`
                    }},
                execute: () => this.winScreen()
            }
        };
        

        /** 
         * @type {Array<string>}
         * @default ["lobby","options","ingame","winScreen"]
         */
        this.stageMap = ["lobby","options","ingame","winScreen"]

        /** @type {{name: string, embedTitle: string, setup?: function(), execute?: function(), customPlayerStatus?: function(), stageEmbed?: boolean, canJoin?: boolean, buttons?: boolean}} */
        this.stage = this.stages[this.stageMap[0]]

        this.errMessages = {
            "cancelled": "Blame the leader",
            "empty": "Everyone left? Y'all scared?",
            "not enough": "Not enough players! Fake friends fr",
            "time": "Make sure to press the button!"
        };

        this.ongoing = true;

        /** @param {ButtonInteraction} i */
        this.playerAddAction = (i) => {
            this.players.set(i.user.id, {user: i.user, stats: {}, other: {}});
        }
    }

    /** Sets each option in this.currentOptions to the default values of this.options if it is not already set */
    setDefaultOptions() {
        this.options.forEach(option => {
            if (!(option.name in this.currentOptions)) {
                this.currentOptions[option.name] = option.value;
            }
        })
    }

    /** Goes to the next stage, or sets this.ongoing to false if no more stages. */
    goNextStage() {
        let index = this.stageMap.indexOf(this.stage.name);
        if (index == this.stageMap.length - 1) {
            this.ongoing = false;
        } else {
            this.stage = this.stages[this.stageMap[index + 1]]
        }
    }
    
    //GOALS: Limit the amount of message updates / creates (costs time / complexity)
    //       but make code as clear as possible, and reduce repetitiveness.

    async runStage() {
        this.responseBody.embeds = this.stage.stageEmbed ? [this.statusEmbed,this.stageEmbed] : [this.statusEmbed]
        if (this.stage.buttons === true) {
            await this.setupButtons();
        } else {
            this.responseBody.components = [];
        }

        if (this.stage.setup) {await this.stage.setup()};
        await this.updateStatus();
        if (this.stage.execute) {await this.stage.execute()};

        this.goNextStage();
    }
    
    /**
     * Creates and starts the game, executing all stages in this.stages sequentially.
     */
    async create() {
        try {
            this.setDefaultOptions();
            this.playerAddAction(this.interaction);
            this.mainResponse = await this.interaction.reply({content: "Loading...", fetchReply: true});

            this.client.games.set(this.client.games.size,this);

            while (this.ongoing) {
                await this.runStage();
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
            new ButtonBuilder().setCustomId("start").setLabel("Start").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("continue").setLabel(this.stage.name === "lobby" ? "Setup" : "Continue").setStyle(ButtonStyle.Primary)
            ,new ButtonBuilder().setCustomId("joinleave").setLabel(this.stage.name === "lobby" ? "Join / Leave" : "Leave").setStyle(ButtonStyle.Secondary)
            ,new ButtonBuilder().setCustomId("cancel").setLabel(this.stage.name === "lobby" ? "Cancel" : "Cancel").setStyle(ButtonStyle.Danger)
        );

        

        this.responseBody.components = [this.buttons];
    }

    /**
     * Creates button collectors to handle button interactions for the current stage.
     * 
     * @param {Function} updateStage - Function to update the stageEmbed when player list is changed (for example, editing an emojis embed if someone leaves)
     * @returns {Promise<void>} Resolves when the button collector ends.
     */
    async createButtonCollectors(updateStage) {

        this.buttonCollector = this.mainResponse.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 120_000,
        });

        this.buttonCollector.on("collect", async (i) => {
            if (i.customId !== "joinleave" && i.user.id != this.players.at().user.id) {
                await i.reply(
                    errorEmbed("You are not the owner of this lobby!")
                );
                return;
            }
            if (i.customId === "start") {
                if (this.players.size < this.properties.minPlayers) {
                    //this can only occur during lobby stages
                    await i.reply(
                        errorEmbed(`Not enough players to continue. (Minimum ${this.properties.minPlayers} players)`)
                    );
                }
                else {
                    //set stage to one before game stage (because goToNextStage gets called)
                    this.stage = this.stages[this.stageMap[this.stageMap.indexOf("ingame") - 1]];
                    this.buttonCollector.stop();
                }
            }
            if (i.customId === "continue") {
                if (this.players.size < this.properties.minPlayers) {
                    //this can only occur during lobby stages
                    await i.reply(
                        errorEmbed(`Not enough players to continue. (Minimum ${this.properties.minPlayers} players)`)
                    );
                }
                else {
                    await i.deferUpdate();
                    this.buttonCollector.stop();
                }
            } else if (i.customId === "cancel") {
               
                await i.deferUpdate();
                this.buttonCollector.stop("cancelled");
                
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
                        await this.updateStatus(true);
                        
                    }
                } else {
                    if (! this.stage.canJoin) {
                        await i.reply(errorEmbed("You are not in this lobby!"));
                    } else if (this.players.size == this.properties.maxPlayers) {
                        await i.reply(errorEmbed("Sorry, the lobby is full!"));
                    } else {
                        await i.deferUpdate();
                        
                        
                        this.playerAddAction(i)

                        await updateStage();
                        await this.updateStatus(true);
                        
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
     * Modifies the statusEmbed description to display the list of current players and correct stage title.
     * @param {boolean} editNow - whether to edit the mainResponse message immediately.
     */

    async updateStatus(editNow = false) {
        let playerString = ``;
        for (var i = 0; i < this.players.size; i++) {
            if (this.stage.customPlayerStatus) {
                playerString += this.stage.customPlayerStatus(i)
            } else {
                if (i == 0) {
                    playerString += `${this.players.at(i).user} - :crown:\n`;
                } else {
                    playerString += `${this.players.at(i).user}\n`;
                }
            }
        }

        this.statusEmbed.setTitle(`${this.properties.gameName} ${this.stage.embedTitle}` + 
            (this.stage.canJoin ? ` [${this.players.size}/${this.properties.maxPlayers}]` : ""));
        this.statusEmbed.setDescription(playerString);

        if (editNow) {await this.mainResponse.edit(this.responseBody)};
    }

    /**
     * Manages the lobby phase, where players can join or leave, and the game owner can start or cancel the game.
     * 
     * Resolves if the lobby was successful, otherwise rejects with a reason.
     */
    async lobbyStage() {
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
            ).user}, change options by typing the option number`
        );
        if (edit) { await this.mainResponse.edit(this.responseBody)};
    }
    
    
    /**
     * Handles the options input phase, allowing the game owner to configure game options.
     * 
     * @returns {Promise<void>} Resolves if the options were successfully configured, otherwise rejects.
     */
    async optionsStage() {
        /** @type {MessageCollector} */
        let oCollector;
        try {
            
    
            var optionSelecting = true;
    
            /** Edits the options message description to show the list of options, asking the owner to select one.*/
            await this.showOptionsList(true);
    
            let optionFilter = (m) => m.author.id == this.players.at(0).user.id;
    
            oCollector = await this.channel.createMessageCollector({
                filter: optionFilter,
                time: 500_000,
            });
    
            let oFilter = (m) => m.author.id == this.players.at(0).user.id;

            /** @type {} */
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

                    if (oSelected.type == "num") {
                        this.currentOptions[oSelected.name] = parseInt(m.content);
                    } else if (oSelected.type == "selection") {
                        this.currentOptions[oSelected.name] = oSelected.selections[parseInt(m.content) - 1];
                    }
                    
    
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
        const playAgain = new ActionRowBuilder().setComponents(
            new ButtonBuilder().setCustomId("playagain").setLabel("Play Again").setStyle(ButtonStyle.Primary));

        const embed = new EmbedBuilder()
        if (this.winner != null) {
            embed
                .setTitle("We have a winner!")
                .setDescription(`All hail ${this.winner}`)
                .setColor("Green")
                .setImage(this.winner.displayAvatarURL());
                
            
        } else {
            embed
                .setTitle("There was no winner...")
                .setDescription(`Everyone's a loser.`)
                .setColor("Red");
        }

        let victoryResponse = await this.channel.send({ components: [playAgain], embeds: [embed] });
        this.ongoing = false;
        victoryResponse.awaitMessageComponent({time: 120_000, componentType: ComponentType.Button}).then((i) => {
            this.createNewGame(i)
        }).finally(() => {victoryResponse.edit({components: []})})

    }
    /**
     * Creates a new game with the same options.
     * @param {} interaction 
     */
    createNewGame(interaction) {
        new Game(interaction,this.currentOptions).create();
    }
}

module.exports = Game;
