require("module-alias-jest/register");
const userBots = require("@config/userBots.json");
const MatthewClient = require("@root/matthewClient");
const UserBot = require("@userBot");
const { Client } = require("discord.js");

/**
 * 
 * @param {MatthewClient} client 
 * @param {Number} BOT_COUNT 
 * @returns {UserBot[]}
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

    client.testGuild = await client.guilds.fetch(process.env.TEST_GUILD_ID);

    let channels = await client.testGuild.channels.fetch();

    for (var channel of channels) {
        if (channel[1].name == "testing-channel") await channel[1].delete();
    }

    bots = [];

    for (var i = 0; i < BOT_COUNT; i++) {
        bots.push(new UserBot());
        await bots[i].login(
            userBots["bots"][i]["username"],
            userBots["bots"][i]["password"]
        );

        bots[i].user = await client.testGuild.members.fetch(bots[i].userId);
        bots[i].guildId = process.env.TEST_GUILD_ID;
        bots[i].botName = client.user.username;
    }


    return bots;
}

/**
 * Creates a testing channel in the test server, and sets the channelId for each bot
 * Then sends the name of the test into the channel
 * @param {Client} client 
 * @param {UserBot[]} bots 
 */
async function eachSetup(client,bots) {
    client.testChannel = await client.testGuild.channels.create({
        name: "testing-channel",
    });
    
    bots.forEach(bot => bot.channelId = client.testChannel.id)
  
    await bots[0].sendMessage(expect.getState().currentTestName);
}
module.exports = {setup, eachSetup};
