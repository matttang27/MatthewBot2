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
    bots = await setup(client, BOT_COUNT);
    await eachSetup(client, bots);

    goToOptions = goToOptionsCreator(GAME_COMMAND, bots, client);

    let [response, optionsResponse] = await goToOptions(3);


    
    
})();
