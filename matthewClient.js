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
     * @deprecated
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
     * General purpose function that returns a promise that waits for a certain event & properties to be emitted in the client.
     * @example
     * waitForEvent(Events.GuildCreate, (g) => {g}, {"name": "MatthewTest"}, 5000)
     * //waits for the bot to be added to a guild in the next 5 seconds
     * @param {Events} event the type of Client Event to wait for
     * @param {Function} function the function to apply to the event (for example, MessageUpdate should only grab newMessage)
     * @param {Object} object the simplified object to compare with the actual object. An empty object accepts any object.
     * @param {Number} timeLimit the amount of milliseconds to wait for
     * @param {Boolean} strictArrays whether arrays should have the same length (see matchesSimplifiedProperties)
     * @returns {Promise<Object|Error>} returns a Promise that either resolves the found object or rejects an Error.
     */
    async waitForEvent(event,func,mockObject,timeLimit,strictArrays=false) {
        //needed because 'this' in the promise is a different scope
        let client = this;
        let checkedObjects = []
        Error.captureStackTrace(checkedObjects);
        
        return await new Promise((resolve, reject) => {
            
    
            /**
             * 
             * @param {Message} message 
             */
            let checker = (...args) => {
                let object = func(...args)

                
                
                let result = this.matchesSimplifiedProperties(object,mockObject,strictArrays)
                if (result === true) {
                    client.off(event,checker);
                    clearTimeout(timeout)
                    resolve(object);
                } else {
                    checkedObjects.push({"result": result, "object": object});
                }
            }

            const timeout = setTimeout(() => {
                client.off(event,checker);
                //maybe print out differences between checkedObjects and mockObject
                console.dir(checkedObjects, {depth: null})
                const error = new Error(`Matching event was not found within the timeLimit for ${JSON.stringify(mockObject, null, 2)}`);
                console.error(error);
                console.error(checkedObjects.stack);
                reject(error);
            }, timeLimit);

            client.on(event, checker);
        });
    }

    /**
     * @deprecated
     * Waits for the next message in the testChannel. 
     * This should be used in tests, where you are testing for a specific interaction and assume everything else works.
     * @returns {Message}
     */
    async waitForNextMessage() {
        return this.waitForMessage({content: true, embeds: true, components: true, userId: true})
    }

    /**
     * Takes in a mock of a message, then applies changes based on input
     * If mockMessage === true instead of an object, allow any message to be sent (with default author, guild and channel)
     * Else if base == true, set content, embeds, components, author, guild, channel to default values if not set.
     * Else no changes made
     * @param {Object} mockMessage
     * @param {Boolean} base
     * @returns {Object}
     */
    editMockMessage(mockMessage,base) {
        const DEFAULTS = {
            "content": "",
            "components": [],
            "embeds": [],
            "author": {id: this.user.id},
            "guildId": this.testGuild.id,
            "channelId": this.testChannel.id
        }
        if (mockMessage === true) { 
            mockMessage = {author: DEFAULTS["author"], guildId: DEFAULTS["guildId"], channelId: DEFAULTS["channelId"]}
        }
        else if (base) {
            
            for (var key in DEFAULTS) {
                if (! mockMessage[key]) {
                    mockMessage[key] = DEFAULTS[key]
                }
            }
        }
        return mockMessage
    }
    async waitForMessageCreate(mockObject,base=false,timeLimit=5000) {
        return this.waitForEvent(Events.MessageCreate,(m) => m, this.editMockMessage(mockObject,base), timeLimit);
    }
    async waitForMessageUpdate(mockObject,base=false,timeLimit=5000) {
        return this.waitForEvent(Events.MessageUpdate,(oM,nM) => nM, this.editMockMessage(mockObject,base), timeLimit)
    }
    async waitForMessageDelete(mockObject,base=false,timeLimit=5000) {
        return this.waitForEvent(Events.MessageDelete,(m) => m, this.editMockMessage(mockObject,base), timeLimit)
    }
    

    /**
     * Compares a real object to a simplified version (ex. for embeds or components).
     * Returns true if every property in the simplified version is identical in the real object.
     * Otherwise, returns a helpful error string.
     * @param {Object} real 
     * @param {Object} mock
     * @returns {string | true} the property that doesn't match / exist
     * 
     * Behaviour (tests can be found in {@link file://./matthewClient.test.js}):
     * Empty objects only checks that realObject key is an object
     * 
     * If strictArrays = true,
     * Arrays require same length.
     * Otherwise, arrays allow extra elements.
     * 
     * @example
     * mock = {test: {}}
     * {test: {}} - PASS, {test: {"HELLO":"HI"}} - PASS, {test: {}} - FAIL, {test: "HELLO"} - FAIL
     * 
     * @example
     * mock = {test: []}
     * strictArrays = true
     * {test: []} - PASS, {test: ["HELLO"]} - PASS, {test: "HELLO"} - FAIL
     * 
     * @example
     * mock = {test: ["HELLO"]}
     * strictArrays = true
     * {test: []} - FAIL, {test: ["HELLO"]} - PASS, {test: ["HELLO","HI"]} - PASS
     * 
     * @todo add map / collection functionality? It is already object, but could add strict mode for length.
     */
    matchesSimplifiedProperties(real,mock,strictArrays=false) {
        for (let key in mock) {
            if (!real.hasOwnProperty(key)) return `${key} does not exist in real`;

            if (mock[key] instanceof Array) {
                if (! (real[key].constructor == Array)) {
                    return `real ${key} has type ${real[key].constructor.name} instead of Array`
                }
                if (strictArrays && real[key].length != mock[key].length) {
                    return `real ${key} has size ${real[key].length} instead of ${mock[key].length}. Turn strictArrays off to allow different lengths.`
                }
                let result = this.matchesSimplifiedProperties(real[key], mock[key])

                
                if (result !== true) {
                    let [index, ...message] = result.split(".");
                    return `${key}[${index}].${message.join(".")}`
                };
            }

            else if (typeof real[key] == "object") {
                let result = this.matchesSimplifiedProperties(real[key], mock[key])
                if (result !== true) return `${key}.` + result;
            } else {
                if (real[key] != mock[key]) return `${key} different: real: ${real[key]}, mock: ${mock[key]}`;
            }
        }
        return true;
    }

}

module.exports = MatthewClient;
