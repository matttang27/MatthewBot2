require("module-alias-jest/register");
const config = require("@config/config.json");
const userBots = require("@config/userBots.json");
const UserBot = require("@userBot");
async function setup(client, BOT_COUNT) {
    client.login();

    await new Promise((resolve, reject) => {
        client.once("error", reject);
        client.once("ready", () => {
            client.off("error", reject);
            resolve();
        });
    });

    client.testGuild = await client.guilds.fetch(config["guildId"]);

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
        bots[i].guildId = config["guildId"];
    }


    return bots;
}

async function eachSetup(client,bots) {
    client.testChannel = await client.testGuild.channels.create({
        name: "testing-channel",
    });
    
    bots.forEach(bot => bot.channelId = client.testChannel.id)
  
    await bots[0].sendMessage(expect.getState().currentTestName);
}
module.exports = {setup, eachSetup};
