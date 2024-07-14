require("module-alias-jest/register");
const MatthewClient = require("@client");
const config = require("@config/config.json");
const userBots = require("@config/userBots.json");
const { l } = require("@root/emojiCharacters");
const client = new MatthewClient(config, true);
const UserBot = require("@userBot");
const setup = require("@testSetup");
const BOT_COUNT = 2;

(async () => {
    bots = await setup(client, BOT_COUNT);

    

    client.testChannel = await client.testGuild.channels.fetch("720351714791915523")

    bots.forEach((bot) => (bot.channelId = client.testChannel.id));
    await bots[0].sendCommand("testgame", "MatthewBot2");

    response = await client.waitForMessage({
        embeds: [{ data: { title: "game game created!  [1/4]" } }],
        components: [{ components: [{}, {}, {}] }],
    });

    await bots[1].clickButton("Join / Leave", response);

    response = await client.waitForMessage({
        embeds: [{ data: { title: "game game created!  [2/4]" } }],
        components: true,
    });

    await bots[0].clickButton("Start", response);

    response = await client.waitForMessage({
        embeds: [{ data: { title: "Options" } }],
        components: true,
    });

    

    await new Promise((r) => setTimeout(r,5000))

    await bots[0].sendMessage("1");

    

    response = await client.waitForMessage({
        embeds: [{ data: { title: "Editing example" } }],
        components: true,
    });

    /*

    await new Promise((r) => setTimeout(r,5000))

    await bots[0].page.waitForSelector('div[role="textbox"]');


    await new Promise(r => setTimeout(r, 2000))

    await bots[0].page.type('div[role="textbox"]', "7");
    await bots[0].page.keyboard.press("Enter");

    /*

    response = await client.waitForMessage({
        embeds: [{ data: { title: "Options" } }],
        components: true,
    });



    await new Promise((r) => setTimeout(r,5000))

    await bots[0].clickButton("Continue", response);

    response = await client.waitForMessage({
        embeds: [{ data: { title: "We have a winner!" } }],
        components: true,
    });
    */
})();
