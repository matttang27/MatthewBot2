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
} = require("discord.js");

const { errorEmbed, successEmbed, returnEmotes } = require("@root/functions");
const MatthewClient = require("@root/matthewClient");

class Game {
    /**
     * 
     * @param {CommandInteraction} interaction 
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
         * @type {Object}
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
         * @type {InteractionResponse}
         */
        this.response;

        /**
         * The embed in the main response message
         * @type {Embed}
         */
        this.mainEmbed = new EmbedBuilder.setColor("Green")

        /**
         * @type {Date}
         */
        this.startTime = new Date(Date.now());


        /**
         * @type {Collection<string, { user: User, stats: Object, other: Object }>}
         */
        this.players = new Collection().set(interaction.user.id, {
            user: interaction.user,
            stats: {},
            other: {},
        });

        

        /**
         * @type {string}
         */
        this.phase = "";

        /**
         * @type {User|null}
         */
        this.winner = null;

        /** @type {[{name: string, embedTitle: string, execute: function()}]} */
        this.stages = [
            {
                name: "lobby",
                embedTitle: "game created!",
                execute: this.lobby
            },
            {
                name: "settings",
                embedTitle: "game configuring...",
                execute: this.lobby
            },
            {
                name: "setup",
                embedTitle: "game setting up...",
                execute: this.inputSettings,
            },
            {
                name: "ingame",
                embedTitle: "game ongoing!",
                execute: this.playGame
            },
            {
                name: "winScreen",
                embedTitle: "game finished",
                execute: this.winScreen
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
    //all testing will need to be revamped.
    async create() {
        try {
            this.response = await this.interaction.deferReply();

            this.client.games.set(this.client.games.size,this);

            for (i in this.stages) {
                this.stage = this.stages[i].name;
                this.mainEmbed.title = this.stages[i].lobbyTitle;
                await this.response.edit({embeds: [this.mainEmbed]});
                await this.stages[i].execute();
            }

        } catch (err) {
            const cancelledEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle(`${this.properties.gameName} game cancelled`);

            

            if (! (err in this.errMessages)) {
                console.log(`${err} was not found in errMessages`);
                return;
                
            }

            cancelledEmbed.setDescription(this.errMessages[err]);
            await this.response.edit({
                embeds: [cancelledEmbed],
                components: [],
            });
        }
    }

    /**
     * updates the description of the mainEmbed with changed players
     */

    async updateLobby() {
        let playerString = ``;
        for (var i = 0; i < this.players.size; i++) {
            if (i == 0) {
                playerString += `${this.players.at(i).user} - :crown:\n`;
            } else {
                playerString += `${this.players.at(i).user}\n`;
            }
        }
        this.mainEmbed.setDescription(playerString);
        

        await this.response.edit({embeds: [this.mainEmbed]});

    }
    /**
     *
     * @returns {Promise} whether the lobby was successful
     */
    async lobby() {
        return new Promise(async (resolve, reject) => {
            this.mainEmbed.title = `${this.properties.gameName} game created! [${this.players.size}/${this.properties.maxPlayers}]`
            this.updateLobby();

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

            const row = new ActionRowBuilder().addComponents(
                start,
                join,
                cancel
            );

            await this.interaction.editReply({
                components: [row],
            });

            const collector = this.response.createMessageComponentCollector({
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
                        collector.stop("cancelled");
                    } else {
                        await i.reply(
                            errorEmbed("You are not the owner of this lobby!")
                        );
                    }
                } else if (i.customId === "joinleave") {
                    if (this.players.has(i.user.id)) {
                        await i.deferUpdate();

                        if (this.players.size == 1) {
                            collector.stop("empty");
                        } else {
                            this.players.delete(i.user.id);

                            this.mainEmbed.setTitle(`${this.properties.gameName} game created! [${this.players.size}/${this.properties.maxPlayers}]`)

                            this.updateLobby();
                            
                        }
                    } else {
                        if (this.players.size == this.properties.maxPlayers) {
                            await i.reply(
                                errorEmbed("Sorry, the lobby is full!")
                            );
                        } else {
                            await i.deferUpdate();

                            this.players.set(i.user.id, {user: i.user, stats: {}, other: {}});

                            this.mainEmbed.setTitle(`${this.properties.gameName} game created! [${this.players.size}/${this.properties.maxPlayers}]`)
                            this.updateLobby();
                            
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

                this.response.edit({
                    embeds: [this.mainEmbed],
                    components: []
                });

                resolve();
            });
        });
    }
    /**
     *
     * @returns {Promise} whether the game should continue (not cancelled)
     */
    async inputSettings() {
        return new Promise(async (resolve, reject) => {
            this.currentOptions = this.options.reduce((obj, cur) => {
                obj[cur.name] = cur.value;
                return obj;
            }, {});

            let message = await this.channel.send({
                content: "Loading Settings",
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

            const settingsEmbed = new EmbedBuilder().setTitle("Options");

            var optionSelecting = true;

            settingsEmbed.setDescription(
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

            

            await message.edit({
                content: "",
                embeds: [settingsEmbed],
                components: [row],
            });

            const bCollector = await message.createMessageComponentCollector({
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
                        if (this.players.size == this.properties.minPlayers) {
                            bCollector.stop("not enough");
                            oCollector.stop();
                            await i.deferUpdate();
                        } else {
                            await i.reply(successEmbed("You have left the lobby!"));
                            
                            this.players.delete(i.user.id);
                            this.updateLobby();

                            if (optionSelecting) {
                                settingsEmbed.setDescription(
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
                                await message.edit({
                                    embeds: [settingsEmbed],
                                });
                            }

                            

                            
                        }
                    } else {
                        await i.reply(errorEmbed("You are not in this lobby!"));
                    }
                }
            });

            bCollector.on("end", async (c, r) => {
                message.delete();
                if (r != "continue") {
                    reject(r);
                } else {
                    this.mainEmbed.setTitle(
                        `${this.properties.gameName} game setting up...`
                    );
                    await this.response.edit({
                        embeds: [this.mainEmbed],
                        components: [],
                    });
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

                    const valueEmbed = new EmbedBuilder()
                        .setTitle(`Editing ${oSelected.label}`)
                        .setDescription(oSelected.desc);

                    await message.edit({ embeds: [valueEmbed] });

                    oFilter = (m) =>
                        oSelected.filter(m) &&
                        m.author.id == this.players.at(0).user.id;
                    optionSelecting = false;
                } else if (!optionSelecting && oFilter(m)) {
                    await m.delete();
                    this.currentOptions[oSelected.name] = parseInt(m.content);

                    

                    settingsEmbed.setDescription(
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
                    await message.edit({ embeds: [settingsEmbed] });

                    optionSelecting = true;
                }
            });
        });
    }

    async setup() {
        this.mainEmbed.setTitle(
            `${this.properties.gameName} game setting up...`
        );
        this.response.edit({
            embeds: [this.mainEmbed],
            components: [],
        });
        return;
    }
    /**
     *
     * @returns {Promise} rejected if no winner
     */
    playGame() {
        /*replace with game*/
        return new Promise(async (resolve, reject) => {
            this.winner = this.players.at(0).user;
            resolve();
        });
    }

    /**
     * 
     * @returns {Promise}
     */
    winScreen() {
        return new Promise(async (resolve, reject) => {
            this.response.edit({
                embeds: [this.mainEmbed],
                components: [],
            });
            if (this.winner != null) {
                const victoryEmbed = new EmbedBuilder()
                    .setTitle("We have a winner!")
                    .setDescription(`All hail ${this.winner}`)
                    .setColor("Green");
                await this.channel.send({ embeds: [victoryEmbed] });
                resolve();
            } else {
                const noVictoryEmbed = new EmbedBuilder()
                    .setTitle("There was no winner...")
                    .setDescription(`Everyone's a loser.`)
                    .setColor("Red");
                await this.channel.send({ embeds: [noVictoryEmbed] });
                resolve();
            }
        });
    }
}

module.exports = Game;
