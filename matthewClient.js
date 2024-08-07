const fs = require('node:fs');
const path = require('node:path');
const mode = process.env.NODE_ENV || 'test'; // Default to 'test' if not set
require('dotenv').config({ path: `.env.${mode}` });
const { Client, Collection, Events, GatewayIntentBits, Message, Guild, TextChannel } = require('discord.js');

class MatthewClient extends Client {
    //Testing variables only
    /** @type {TextChannel} */
    testChannel;
    /** @type {Guild} */
    testGuild;

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds, 
                GatewayIntentBits.MessageContent, 
                GatewayIntentBits.GuildMessages, 
                GatewayIntentBits.GuildMessageReactions, 
                GatewayIntentBits.DirectMessages, 
                GatewayIntentBits.DirectMessageReactions,
                GatewayIntentBits.GuildMembers,
            ]
        });

        this.commands = new Collection();

        this.setupCommands();
        this.setupEvents();

        this.on("error", (e) => console.error(e));
        this.on("warn", (e) => console.warn(e));

        if (mode == 'production') {
            this.on("debug", (e) => console.info(e));
        }
        
        process.on('unhandledRejection', error => {
            console.error('Unhandled promise rejection:', error);
        });
    }

    setupCommands() {
        const foldersPath = path.join(__dirname, 'commands');
        const commandFolders = fs.readdirSync(foldersPath);

        for (const folder of commandFolders) {
            const commandsPath = path.join(foldersPath, folder);
            const commandFiles = fs.readdirSync(commandsPath, { recursive: true }).filter(file => file.endsWith('.js') && (!file.endsWith('.test.js')));
            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                const command = require(filePath);
                if ('data' in command && 'execute' in command) {
                    this.commands.set(command.data.name, command);
                } else {
                    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
                }
            }
        }
    }

    setupEvents() {
        const eventsPath = path.join(__dirname, 'events');
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            const filePath = path.join(eventsPath, file);
            const event = require(filePath);
            if (event.once) {
                this.once(event.name, (...args) => event.execute(...args));
            } else {
                this.on(event.name, (...args) => event.execute(...args));
            }
        }
    }

    async login() {
        console.log(process.env.BOT_TOKEN)
        await super.login(process.env.BOT_TOKEN);
    }

    /**
     * @description For testing purposes: returns a Promise for a specific messageCreate or messageUpdate to be emitted.
     * Options have default values, and can be set to true to accept any value.
     * @example
     * // Embed Example: Two embeds with "hello" and "bye" as descriptions
     * embeds: [
     *  {"data": {"description":"hello"}},
     *  {"data": {"description":"bye"}}
     * ]
     * 
     * // Buttons Example: One action row with 2 buttons label "Start" and "End", and customId "start-button"
     * components: [{ components: 
     *   [{data: { label: "Start", customId: "start-button"}},
     *   {data: { label: "End"}}]
     *  }]
     * 
     * @see {@link https://discord.js.org/docs/packages/discord.js/14.15.3/Message:Class} for the structure of embeds and components
     * @param {Object} options
     * @param {String | true} options.content
     * @param {Object[] | true} options.embeds
     * @param {Number | true} options.timeLimit
     * @param {Number | true} options.channelId
     * @param {Number | true} options.userId
     * @default "" | options.content
     * [] | options.embeds
     * [] | options.components
     * this.user.id | options.userId
     * 5000 | options.timeLimit
     * this.testChannel.id | options.channelId
     * @returns {Message | Message[]} either the found message or the array of messages checked.
     */
    async waitForMessage({
        content = "",
        embeds = [],
        components = [],
        userId = this.user.id,
        timeLimit = 5000,
        channelId = this.testChannel.id
    } = {}) {

        
        let client = this;
        
        return await new Promise((resolve, reject) => {
            let checkedMessages = []

            const timeout = setTimeout(() => {
                client.off(Events.MessageCreate,createdFunc);
                client.off(Events.MessageUpdate,updateFunc);
                console.dir(checkedMessages, {depth: null})
                reject(new Error(`Message was not found within the timeLimit ${JSON.stringify({ content, embeds, components, userId, timeLimit, channelId }, null, 2)}`));
            }, timeLimit);
    
            /**
             * 
             * @param {Message} message 
             */
            let createdFunc = (message) => {
                checkedMessages.push(message);
                if ((userId === true || message.author.id == userId) && 
                    (content === true || message.content == content) &&
                    (channelId === true || message.channel.id == channelId) &&
                    (embeds === true || this.matchesSimplifiedProperties(message.embeds,embeds)) && 
                    (components === true || this.matchesSimplifiedProperties(message.components,components))
                ) {
                    client.off(Events.MessageCreate,createdFunc);
                    client.off(Events.MessageUpdate,updateFunc);
                    clearTimeout(timeout);
                    resolve(message);
                }
            }

            let updateFunc = (oldMessage, newMessage) => {createdFunc(newMessage)}
            client.on(Events.MessageCreate, createdFunc);
            client.on(Events.MessageUpdate, updateFunc);
        });
    }

    /**
     * Waits for the next message in the testChannel. 
     * This should be used in tests, where you are testing for a specific interaction and assume everything else works.
     * @returns {Message}
     */
    async waitForNextMessage() {
        return this.waitForMessage({content: true, embeds: true, components: true, userId: true})
    }

    /**
     * Compares a real object to a simplified version (ex. for embeds or components).
     * Returns true if every property in the simplified version is identical in the real object.
     * @param {Object} real 
     * @param {Object} mock
     */
    matchesSimplifiedProperties(real,mock) {
        for (let key in mock) {
            if (!real.hasOwnProperty(key)) return false;
            /*
            if (mock[key].constructor == Array) {
                if (real[key].constructor != Array || real[key].length != mock[key].length) return false;
                for (i=0;i<real[key].length;i++) {
                    if (! this.matchesSimplifiedProperties(real[key][i],mock[key][i])) return false;
                }*/
            if (typeof real[key] == "object") {
                if (! this.matchesSimplifiedProperties(real[key], mock[key])) return false;
            } else {
                if (real[key] != mock[key]) return false;
            }
        }
        return true;
    }

}

module.exports = MatthewClient;
