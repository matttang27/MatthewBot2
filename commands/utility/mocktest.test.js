require("module-alias-jest/register");
const MatthewClient = require("@client");
const config = require("@config/config.json");
const userBots = require("@config/userBots.json");
const client = new MatthewClient(config, true);

const UserBot = require("@userBot");

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
  bot1 = new UserBot();
  await bot1.login(
    userBots["bots"][0]["username"],
    userBots["bots"][0]["password"]
  );
  bot1.guildId = config["guildId"];
}, 100_000);

beforeEach(async () => {
  client.testChannel = await client.testGuild.channels.create({
    name: "testing-channel",
  });
  bot1.channelId = client.testChannel.id;
});

afterEach(async () => {
  await client.testChannel.delete();
});

describe("mocktest command", () => {
  it("command interaction, button, and message should work", async () => {
    await bot1.sendCommand("mocktest", "MatthewBot2");

    let response = await client.waitForMessage({
        content: "Press Button",
      components: [{ components: [{ data: { label: "Test" } }] }],
    });

    await bot1.clickButton("Test", response.id);

    response = await client.waitForMessage({ content: "type pls" });;

    await bot1.sendMessage("Hello");

    response = await client.waitForMessage({ content: "Hello" });
    expect(response.content).toBe("Hello");
  }, 25_000);
});
