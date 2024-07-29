require("module-alias-jest/register");
const MatthewClient = require("@client");
const { l } = require("@root/emojiCharacters");
const client = new MatthewClient();
const UserBot = require("@userBot");
const { setup, eachSetup } = require("@testSetup");
const BOT_COUNT = 1;

(async () => {
    bots = await setup(client, BOT_COUNT);

    client.testChannel = await client.testGuild.channels.fetch(
        "720351714791915523"
    );

    bots.forEach((bot) => (bot.channelId = client.testChannel.id));
    await bots[0].sendCommand("testgame");
    let response = await client.waitForMessage({
        embeds: [{ data: { title: "game game created! [1/4]" } }],
        components: [
            {
                components: [
                    { data: { label: "Start" } },
                    { data: { label: "Join / Leave" } },
                    { data: { label: "Cancel" } },
                ],
            },
        ],
    })

    console.log(response);
})();
