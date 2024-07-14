//Testing with UserBots will be done here

require("module-alias-jest/register");
const MatthewClient = require("@client");
const config = require("@config/config.json");
const userBots = require("@config/userBots.json");
const client = new MatthewClient(config, true);

const UserBot = require("@userBot");
const { Message } = require("discord.js");
const BOT_COUNT = 3;

/** @type {UserBot[]} */
let bots;

/** @type {Message} */
let response;

const {setup, eachSetup} = require('@testSetup');
beforeAll(async () => {
  bots = await setup(client, 2)
}, 100_000);

beforeEach(async () => {
  await eachSetup(client,bots);
});
afterAll(async () => {
  bots.forEach(bot => bot.browser.close())
})

describe("connect4 command", () => {
  it("runs a normal game properly", async () => {
    await bots[0].sendCommand("connect4", "MatthewBot2");

    response = await client.waitForMessage({
      embeds: [
        {data: {title: "Connect4 game created!  [1/6]"}}],
      components: [{ components: [{},{},{}] }],
    });

    await bots[1].clickButton("Join / Leave", response);

    response = await client.waitForMessage({
      embeds: [
        {data: {title: "Connect4 game created!  [2/6]"}}],
      components: true,
    });

    await bots[0].clickButton("Start", response);
  }, 50_000);
});
