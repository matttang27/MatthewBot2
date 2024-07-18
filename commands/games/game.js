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

const { errorEmbed, successEmbed, returnEmotes } = require("@root/functions");

class Game {
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
         * @type {Interaction}
         */
        this.interaction = interaction;

        /**
         * @type {Channel}
         */
        this.channel = interaction.channel;

        /**
         * The main response message
         * @type {Response}
         */
        this.response;

        /**
         * The embed in the main response message
         * @type {Embed}
         */
        this.mainEmbed;

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
         * @type {Object}
         */
        this.currentOptions = {};

        /**
         * @type {string}
         */
        this.phase = "";

        /**
         * @type {User|null}
         */
        this.winner = null;
    }
    async create() {
        try {
            this.response = await this.interaction.deferReply();

            this.stage = "lobby";
            await this.lobby();

            this.stage = "settings";
            await this.inputSettings();

            this.stage = "setup";
            await this.setup();

            this.stage = "ingame";
            await this.playGame();

            this.stage = "winScreen";
            await this.winScreen();

            this.stage = "finished";
        } catch (err) {
            const cancelledEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle(`${this.properties.gameName} game cancelled`);

            const errMessages = {
                cancelled: "Blame the leader",
                empty: "Everyone left? Y'all scared?",
                "not enough": "Not enough players! Fake friends fr",
            };

            if (err in errMessages) {
                cancelledEmbed.setDescription(errMessages[err]);
            } else {
                console.log(err);
                return;
            }

            await this.response.edit({
                embeds: [cancelledEmbed],
                components: [],
            });
        }
    }

    /**
     * updates the description of the main embed with changed players
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
            const START_TITLE = `${this.properties.gameName} game created! `;

            this.mainEmbed = new EmbedBuilder()
                .setColor("Green")
                .setTitle(START_TITLE)

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
                                errorEmbed("Not enough players to start.")
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

                            this.updateLobby();
                            
                        }
                    }
                }
            });

            collector.once("end", async (collected, reason) => {
                if (reason == "cancelled" || reason == "empty") {
                    reject(reason);
                }

                if (this.players.size < this.properties.minPlayers) {
                    reject("not enough");
                }

                this.mainEmbed.setTitle(
                    `${this.properties.gameName} game: configuring...`
                );
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
                time: 500_000,
            });

            let optionFilter = (m) => m.author.id == this.players.at(0).user.id;

            const oCollector = await this.channel.createMessageCollector({
                filter: optionFilter,
                time: 120_000,
            });

            

            let oFilter = (m) => m.author.id == this.players.at(0).user.id;

            let oSelected;

            bCollector.on("collect", async (i) => {
                if (i.customId === "continue") {
                    if (i.user.id == this.players.at(0).user.id) {
                        bCollector.stop();
                        oCollector.stop();
                        await i.deferUpdate();
                    } else {
                        await i.reply(
                            errorEmbed("You are not the owner of this lobby!")
                        );
                    }
                } else if (i.customId === "cancel") {
                    if (i.user.id == this.players.at(0).user.id) {
                        bCollector.stop();
                        oCollector.stop("cancelled");
                    } else {
                        await i.reply(
                            errorEmbed("You are not the owner of this lobby!")
                        );
                    }
                } else if (i.customId === "leave") {
                    if (this.players.has(i.user.id)) {
                        if (this.players.size < this.properties.minPlayers) {
                            bCollector.stop();
                            oCollector.stop("not enough");
                            await i.deferUpdate();
                        } else {
                            this.players.delete(i.user.id);
                            this.updateLobby();

                            await i.reply(successEmbed("You have left the lobby!"));
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

                    oFilter = (m) =>
                        oSelected.filter(m) &&
                        m.author.id == this.players.at(0).user.id;
                    optionSelecting = false;
                } else if (!optionSelecting && oFilter(m)) {
                    this.currentOptions[oSelected.name] = parseInt(m.content);

                    

                    settingsEmbed.setDescription(
                        `${this.options
                            .map((option, index) => {
                                return `${index + 1}. ${option.name} - **${
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

            oCollector.on("end", async (c, r) => {
                message.delete();
                if (r == "cancelled" || r == "empty" || r == "not enough") {
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

    async setup() {
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
    winScreen() {
        return new Promise(async (resolve, reject) => {
            this.mainEmbed.setTitle(
                `${this.properties.gameName} game finished!`
            );
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
