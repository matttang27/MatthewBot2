require("module-alias-jest/register");
const MatthewClient = require("@client");
const { l } = require("@root/emojiCharacters");
const client = new MatthewClient();
const UserBot = require("@userBot");
const { setup, eachSetup } = require("@testSetup");
const BOT_COUNT = 3;

async function goToOptions(num_players) {
    await bots[0].sendCommand("testgame");
    let response = await client.waitForMessage({
        embeds: [{}],
        components: [{ components: [{}, {}, {}] }],
    });

    for (var i = 1; i < num_players; i++) {
        await bots[i].clickButton("Join / Leave", response);

        response = await client.waitForMessage({
            embeds: [{}],
            components: [{ components: [{}, {}, {}] }],
        });
    }

    await bots[0].clickButton("Start", response);

    let optionResponse = await client.waitForMessageCreate({embeds: [{ data: { title: "Options" } }]});

    /*let [mainResponse, optionResponse] = await Promise.all(
        [client.waitForMessageUpdate({id: response.id}),
            client.waitForMessageCreate({embeds: [{ data: { title: "Options" } }]
    }),]);*/

    return [mainResponse, optionResponse];
}

(async () => {
    bots = await setup(client, BOT_COUNT);

    client.testChannel = await client.testGuild.channels.fetch(
        "720351714791915523"
    );

    bots.forEach((bot) => (bot.channelId = client.testChannel.id));

    let [response,optionsResponse] = await goToOptions(3)
    
    
})();
