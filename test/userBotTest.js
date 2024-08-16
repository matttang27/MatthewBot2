require("module-alias-jest/register");
const MatthewClient = require("@client");
const { l } = require("@root/emojiCharacters");
const client = new MatthewClient();
const UserBot = require("@userBot");
const { setup, eachSetup } = require("@testSetup");
const BOT_COUNT = 3;

(async () => {
    bots = await setup(client, BOT_COUNT);
    await eachSetup(client, bots);

    let helloMessagePromise = client.waitForMessageCreate({content: "Hello"})
    bots[0].sendMessage("Hello");

    let helloMessage = await helloMessagePromise;
    console.log(helloMessage);
    await bots[0].addReaction("red_circle", helloMessage);

    
    
})();
