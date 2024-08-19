require("module-alias-jest/register");
const MatthewClient = require("@client");
const { l } = require("@root/emojiCharacters");
const client = new MatthewClient();
const UserBot = require("@userBot");
const { setup, eachSetup } = require("@testSetup");
const BOT_COUNT = 3;
const {goToOptionsCreator, goToOptionsBase} = require("@testHelpers");

let goToOptions;
const GAME_COMMAND = "connect4";

(async () => {
    let bots = await setup(client, BOT_COUNT);
    await eachSetup(client, bots);

    goToOptions = goToOptionsCreator(GAME_COMMAND, bots, client);

    let [response, optionsResponse] = await goToOptions(3);

    await bots[0].clickButton("Continue", optionsResponse);
    let [mainEdit, emojiResponse, optionsDelete] = await Promise.all([
        client.waitForMessageUpdate({embeds: [{ data: { title: "Connect4 game setting up..." } }]}),
        client.waitForMessageUpdate({embeds: [{ data: { title: "Set emojis" }}]}),
        client.waitForMessageDelete({embeds: [{ data: { title: "Options" }}],
        }),
    ]);

    await bots[0].addReaction("yellow_circle", emojiResponse);



    
    
})();
