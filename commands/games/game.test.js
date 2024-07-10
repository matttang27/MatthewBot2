//Testing with UserBots will be done here

require("module-alias-jest/register");
const MatthewClient = require("@client");
const config = require("@config/config.json");
const userBots = require("@config/userBots.json");
const client = new MatthewClient(config, true);

const UserBot = require("@userBot");
const { Message } = require("discord.js");
const BOT_COUNT = 2;

/** @type {UserBot[]} */
let bots = [];

/** @type {Message} */
let response;

const setup = require('@testSetup');
beforeAll(async () => {
  bots = await setup(client, 2)
}, 100_000);

beforeEach(async () => {
  client.testChannel = await client.testGuild.channels.create({
      name: "testing-channel",
  });
  
  bots.forEach(bot => bot.channelId = client.testChannel.id)
});

afterAll(async () => {
  bots.forEach(bot => bot.browser.close())
})

describe("testgame command", () => {
  it("runs a normal game properly", async () => {
    try {
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

      expect(response.embeds.at(0).data.title).toBe("Options");
    } catch (err) {
      console.error(err);
    }
  }, 200_000);
});
