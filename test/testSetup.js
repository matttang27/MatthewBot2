require("module-alias-jest/register");
const userBots = require("@config/userBots.json");
const MatthewClient = require("@root/matthewClient");
const UserBot = require("@userBot");
const { Client } = require("discord.js");
const fs = require('fs');
const deployCommands = require("@root/deploy-commands.js")
/**
 * Sets up the testing environment by logging in the main client, deploying commands, and initializing a set of user bots.
 * The function performs the following steps:
 * 1. Logs in the main `MatthewClient`.
 * 2. Waits for the client to be ready.
 * 3. Deploys commands to the test guild.
 * 4. Fetches the test guild and deletes any existing channels with names starting with "tz".
 * 5. Initializes and logs in the specified number of user bots.
 * 6. Updates the `userBots.json` file with bot user IDs if they are not already present.
 * 
 * @param {MatthewClient} client 
 * @param {Number} BOT_COUNT - The number of user bots to initialize
 * @returns {Promise<UserBot[]>} A promise that resolves to an array of logged-in `UserBot` instances.
 */
async function setup(client, BOT_COUNT) {
    client.login();

    await new Promise((resolve, reject) => {
        client.once("error", reject);
        client.once("ready", () => {
            client.off("error", reject);
            resolve();
        });
    });

    await deployCommands(client);

    client.testGuild = await client.guilds.fetch(process.env.TEST_GUILD_ID);

    let channels = await client.testGuild.channels.fetch();

    for (var channel of channels) {
        if (channel[1].name.startsWith("tz")) await channel[1].delete();
    }

    bots = [];

    needJSONUpdate = false;

    for (var i = 0; i < BOT_COUNT; i++) {
        bots.push(new UserBot());
        await bots[i].login(
            userBots["bots"][i]["username"],
            userBots["bots"][i]["password"],
            userBots["bots"][i]["id"],
            userBots["bots"][i]["endpoint"]
        );

        if (userBots["bots"][i]["id"] === undefined) {
            needJSONUpdate = true;
            userBots["bots"][i]["id"] = bots[i].userId;
        }

        bots[i].user = await client.testGuild.members.fetch(bots[i].userId);
        bots[i].guildId = process.env.TEST_GUILD_ID;
        bots[i].botName = client.user.username;
    }

    if (needJSONUpdate) {
        fs.writeFile(require.resolve('@config/userBots.json'), JSON.stringify(userBots, null, 2), 'utf8', (err) => {
            if (err) {console.error(err)}
            else {console.log("userBots.json has been updated with user IDs")}
        });
    }

    console.log("All user bots have logged in!");


    return bots;
}

/**
 * Creates a testing channel in the test server, and sets the channelId for each bot
 * If the global `expect` object is available (indicating that the function is being run in a test environment),
 * the channel name is set to the name of the current test case, and the first bot sends a message with the full test name in the new channel.
 * Otherwise, a default name is used without a message.
 * @param {Client} client 
 * @param {UserBot[]} bots 
 */
async function eachSetup(client,bots) {
    //what does tz even stand for???

    if (typeof expect === "undefined") {
        client.testChannel = await client.testGuild.channels.create({
            name: "custom test"
        })
    }
    else {
        client.testChannel = await client.testGuild.channels.create({
            name: "tz ".concat(expect.getState().currentTestName).slice(0,100),
        });
    }
    
    bots.forEach(bot => bot.channelId = client.testChannel.id)
    if (typeof expect !== "undefined") {
        await bots[0].sendMessage(expect.getState().currentTestName)
    };
}
module.exports = {setup, eachSetup};
