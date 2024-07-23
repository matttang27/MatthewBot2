require("module-alias-jest/register");

const { REST, Routes } = require("discord.js");
const { clientId, token } = require("@config/config.json");
const fs = require("node:fs");
const path = require("node:path");

const MatthewClient = require("@client");
const config = require("@config/config.json");



async function deployCommands(client) {
    const commands = [];
    // Grab all the command folders from the commands directory you created earlier
    const foldersPath = path.join(__dirname, "commands");
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        // Grab all the command files from the commands directory you created earlier
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs
            .readdirSync(commandsPath, { recursive: true })
            .filter(
                (file) => file.endsWith(".js") && !file.endsWith(".test.js")
            );
        // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            if ("data" in command && "execute" in command) {
                commands.push(command.data.toJSON());
            } else {
                console.log(
                    `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
                );
            }
        }
    }

    // Construct and prepare an instance of the REST module
    const rest = new REST().setToken(token);

    try {
        await client.login();

        let guilds = await client.guilds.fetch();
        for (let i = 0; i < guilds.size; i++) {
            console.log(
                `Started refreshing ${
                    commands.length
                } application (/) commands for ${guilds.at(i).name}`
            );

            // The put method is used to fully refresh all commands in the guild with the current set

            const data = await rest.put(
                Routes.applicationGuildCommands(clientId, guilds.at(i).id),
                { body: commands }
            );

            console.log(
                `Successfully reloaded ${
                    data.length
                } application (/) commands for ${guilds.at(i).name}`
            );
        }
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
}

if (require.main === module) {
	const client = new MatthewClient(config, true);
    client.login().then(() => deployCommands(client));
} else {
	module.exports = deployCommands;
}