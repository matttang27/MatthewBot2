require("module-alias-jest/register");
const MatthewClient = require("@client");
const client = new MatthewClient();


const UserBot = require("@userBot");
var bots = [];

const {setup, eachSetup} = require('@testSetup');
beforeAll(async () => {
  bots = await setup(client, 1)
}, 100_000);

beforeEach(async () => {
  await eachSetup(client,bots);
});

afterAll(async () => {
    bots.forEach((bot) => bot.browser.close());
});

describe("ping command", () => {
    it("should reply with Pong", async () => {
        await bots[0].sendCommand("ping");

        let response = await client.waitForMessage({ content: "Pong!" });
        expect(response.content).toBe("Pong!");
    }, 1000_000);
});
