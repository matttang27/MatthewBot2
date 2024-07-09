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
beforeAll(async () => {
  client.login();

  await new Promise((resolve, reject) => {
    client.once("error", reject);
    client.once("ready", () => {
      client.off("error", reject);
      resolve();
    });
  });

  client.testGuild = await client.guilds.fetch(config["guildId"]);
  bots = [new UserBot(), new UserBot(), new UserBot()];

  for (var i = 0; i < BOT_COUNT; i++) {
    await bots[i].login(
      userBots["bots"][i]["username"],
      userBots["bots"][i]["password"]
    );
    
    bots[i].user = await client.testGuild.members.fetch(bots[i].userId);
    bots[i].guildId = config["guildId"];
  }
}, 100_000);

beforeEach(async () => {
  client.testChannel = await client.testGuild.channels.create({
    name: "testing-channel",
  });
  for (var i = 0; i < BOT_COUNT; i++) {
    bots[i].channelId = client.testChannel.id;
  }
});

afterEach(async () => {
  await client.testChannel.delete();
});

describe("connect4 command", () => {
  it("runs a normal game properly", async () => {
    await bots[0].sendCommand("connect4", "MatthewBot2");

    response = await client.waitForMessage({
      embeds: [
        {data: {title: "Connect4 game created!  [1/6]"}}],
      components: [{ components: [{},{},{}] }],
    });

    await bots[1].clickButton("Join / Leave", response.id);

    response = await client.waitForMessage({
      embeds: [
        {data: {title: "Connect4 game created!  [2/6]"}}],
      components: true,
    });

    await bots[0].clickButton("Start", response.id);

    response = await client.waitForMessage({ content: "Hello" });
    expect(response.content).toBe("Hello");
  }, 25_000);
});
