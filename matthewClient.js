const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, Message, Embed } = require('discord.js');

class MatthewClient extends Client {
    constructor(config, testing) {
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
        this.testing = testing;
        this.config = config;

        this.setupCommands();
        this.setupEvents();

        this.on("error", (e) => console.error(e));
        this.on("warn", (e) => console.warn(e));

        if (!testing) {
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

    login() {
        super.login(this.config.token);
    }

    /**
     * For testing purposes: returns a Promise for a specific messageCreate to be emitted.
     * @param {Object} options
     * @param {String} options.content
     * @param {Object[]} options.embeds
     * @param {Number} options.timeLimit
     * @param {Number} options.channelId
     * @returns 
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
            const timeout = setTimeout(() => {
                client.off(Events.MessageCreate,createdFunc);
                client.off(Events.MessageUpdate,updateFunc);
                reject(new Error("Time limit reached"));
            }, timeLimit);
    
            /**
             * 
             * @param {Message} message 
             */
            let createdFunc = (message) => {
                if (message.author.id = userId && message.content == content && message.channel.id == channelId
                    && this.matchesSimplifiedProperties(message.embeds,embeds)
                    && this.matchesSimplifiedProperties(message.components,components)
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
