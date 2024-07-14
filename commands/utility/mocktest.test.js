require("module-alias-jest/register");
const MatthewClient = require("@client");
const config = require("@config/config.json");
const userBots = require("@config/userBots.json");
const client = new MatthewClient(config, true);

const UserBot = require("@userBot");
const {setup, eachSetup} = require('@testSetup');
beforeAll(async () => {
  bots = await setup(client, 1)
}, 100_000);

beforeEach(async () => {
  await eachSetup(client,bots);
});

afterAll(async () => {
  bots.forEach(bot => bot.browser.close())
})

describe("mocktest command", () => {
    it("command interaction, button, and message should work", async () => {
        await bots[0].sendCommand("mocktest", "MatthewBot2");

        let response = await client.waitForMessage({
            content: "Press Button",
            components: [{ components: [{ data: { label: "Test" } }] }],
        });

        await bots[0].clickButton("Test", response);

        response = await client.waitForMessage({ content: "type pls" });

        await bots[0].sendMessage("Hello");

        response = await client.waitForMessage({ content: "Hello" });
        expect(response.content).toBe("Hello");
    }, 100_000);
});
