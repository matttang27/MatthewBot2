const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');

class MatthewClient {
    constructor(config, testing) {
        this.client = new Client({ 
            intents: [
                GatewayIntentBits.Guilds, 
                GatewayIntentBits.MessageContent, 
                GatewayIntentBits.GuildMessages, 
                GatewayIntentBits.GuildMessageReactions, 
                GatewayIntentBits.DirectMessages, 
                GatewayIntentBits.DirectMessageReactions
            ] 
        });
        this.client.commands = new Collection();
        this.client.testing = testing;
        this.config = config;


        this.setupCommands();
        this.setupEvents();

        this.client.on("error", (e) => console.error(e));
        this.client.on("warn", (e) => console.warn(e));

        if (!testing) {
            this.client.on("debug", (e) => console.info(e));
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
                    this.client.commands.set(command.data.name, command);
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
                this.client.once(event.name, (...args) => event.execute(...args));
            } else {
                this.client.on(event.name, (...args) => event.execute(...args));
            }
        }
    }

    login() {
        this.client.login(this.config.token);
    }
}

module.exports = MatthewClient;