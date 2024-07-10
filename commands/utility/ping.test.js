require("module-alias-jest/register");
const MatthewClient = require("@client");
const config = require("@config/config.json");
const userBots = require("@config/userBots.json");
const client = new MatthewClient(config, true);
const setup = require("@testSetup");

const UserBot = require("@userBot");
var bots = [];

beforeAll(async () => {
    bots = await setup(client, 1);
}, 100_000);

beforeEach(async () => {
    client.testChannel = await client.testGuild.channels.create({
        name: "testing-channel",
    });

    bots.forEach((bot) => (bot.channelId = client.testChannel.id));
});

afterAll(async () => {
    bots.forEach((bot) => bot.browser.close());
});

describe("ping command", () => {
    it("should reply with Pong!", async () => {
        await bots[0].sendCommand("ping", "MatthewBot2");

        let response = await client.waitForMessage({ content: "Pong!" });
        expect(response.content).toBe("Pong!");
    }, 1000_000);
});
