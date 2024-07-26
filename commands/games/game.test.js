//Testing with UserBots will be done here

require("module-alias-jest/register");
const MatthewClient = require("@client");

const client = new MatthewClient();

const UserBot = require("@userBot");
const { Message } = require("discord.js");
const BOT_COUNT = 2;

/** @type {UserBot[]} */
let bots = [];

/** @type {Message} */
let response;

const { setup, eachSetup } = require("@testSetup");
beforeAll(async () => {
    bots = await setup(client, BOT_COUNT);
}, 100_000);

beforeEach(async () => {
    await eachSetup(client, bots);
});

afterAll(async () => {
    bots.forEach((bot) => bot.browser.close());
});

describe("testgame command", () => {
    it("runs a normal game properly", async () => {
        await bots[0].sendCommand("testgame");

        response = await client.waitForMessage({
            embeds: [{ data: { title: "game game created! [1/4]" } }],
            components: [{ components: [{}, {}, {}] }],
        });

        await bots[1].clickButton("Join / Leave", response);

        response = await client.waitForMessage({
            embeds: [{ data: { title: "game game created! [2/4]" } }],
            components: true,
        });

        await bots[0].clickButton("Start", response);

        response = await client.waitForMessage({
            embeds: [{ data: { title: "Options" } }],
            components: true,
        });

        expect(
            response.embeds.at(0).data.description.includes("Example setting - **5**")
        ).toBeTruthy();

        await bots[0].sendMessage("1");

        response = await client.waitForMessage({
            embeds: [{ data: { title: "Editing Example setting" } }],
            components: true,
        });

        await bots[0].sendMessage("7");

        response = await client.waitForMessage({
            embeds: [{ data: { title: "Options" } }],
            components: true,
        });

        expect(
            response.embeds.at(0).data.description.includes("Example setting - **7**")
        ).toBeTruthy();

        await bots[0].clickButton("Continue", response);

        response = await client.waitForMessage({
            embeds: [{ data: { title: "We have a winner!" } }],
            components: true,
        });

        expect(
            response.embeds
                .at(0)
                .data.description.includes(`<@${bots[0].userId}>`)
        ).toBeTruthy();
    }, 200_000);
    it("cancels the game when owner presses cancel in lobby", async () => {
        await bots[0].sendCommand("testgame");

        response = await client.waitForMessage({
            embeds: [{ data: { title: "game game created!  [1/4]" } }],
            components: [{ components: [{}, {}, {}] }],
        });

        await bots[0].clickButton("Cancel", response);

        response = await client.waitForMessage({
            embeds: [
                {
                    data: {
                        title: "game game cancelled",
                        description: "Blame the leader",
                    },
                },
            ],
        });
    });
    it("cancels the game when owner presses Cancel Game in options", async () => {
        await bots[0].sendCommand("testgame");

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

        await bots[1].clickButton("Cancel Game", response);

        await client.waitForMessage({
            embeds: [
                {
                    data: {
                        description: "You are not the owner of this lobby!",
                    },
                },
            ],
            components: true,
        });

        await bots[0].clickButton("Cancel Game", response);

        response = await client.waitForMessage({
            embeds: [
                {
                    data: {
                        title: "game game cancelled",
                        description: "Blame the leader",
                    },
                },
            ],
        });
    });
    it("cancels the game if everyone leaves", async () => {
        await bots[0].sendCommand("testgame");

        response = await client.waitForMessage({
            embeds: [{ data: { title: "game game created!  [1/4]" } }],
            components: [{ components: [{}, {}, {}] }],
        });

        await bots[0].clickButton("Join / Leave", response);

        response = await client.waitForMessage({
            embeds: [{ data: { title: "game game cancelled" } }],
        });
    }, 100_000);
    it("sends an ephemeral message if non-owner presses start / cancel", async () => {
        await bots[0].sendCommand("testgame");

        response = await client.waitForMessage({
            embeds: [{ data: { title: "game game created!  [1/4]" } }],
            components: [{ components: [{}, {}, {}] }],
        });

        await bots[1].clickButton("Join / Leave", response);

        response = await client.waitForMessage({
            embeds: [{ data: { title: "game game created!  [2/4]" } }],
            components: true,
        });

        await bots[1].clickButton("Start", response);

        await client.waitForMessage({
            embeds: [
                {
                    data: {
                        description: "You are not the owner of this lobby!",
                    },
                },
            ],
            components: true,
        });

        await bots[1].clickButton("Cancel", response);

        await client.waitForMessage({
            embeds: [
                {
                    data: {
                        description: "You are not the owner of this lobby!",
                    },
                },
            ],
            components: true,
        });

        await bots[0].clickButton("Start", response);

        response = await client.waitForMessage({
            embeds: [{ data: { title: "Options" } }],
            components: true,
        });
    }, 100_000);

    it("ignores non-owner when inputting settings", async () => {
        await bots[0].sendCommand("testgame");

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

        await bots[1].sendMessage("1");

        await bots[0].sendMessage("1");

        response = await client.waitForMessage({
            embeds: [{ data: { title: "Editing example" } }],
            components: true,
        });

        await bots[1].sendMessage("6");

        await bots[0].sendMessage("7");

        response = await client.waitForMessage({
            embeds: [{ data: { title: "Options" } }],
            components: true,
        });

        expect(
            response.embeds.at(0).data.description.includes("example - **7**")
        ).toBeTruthy();
    });
    it("sends an ephemeral message if not enough players to start", async () => {
        await bots[0].sendCommand("testgame");

        response = await client.waitForMessage({
            embeds: [{ data: { title: "game game created!  [1/4]" } }],
            components: [{ components: [{}, {}, {}] }],
        });

        await bots[0].clickButton("Start", response);

        response = await client.waitForMessage({
            embeds: [{ data: { description: "Not enough players to start." } }],
            components: true,
        });
    }, 100_000);

    it("automatically starts the game if the lobby timer runs out", async () => {
        await bots[0].sendCommand("testgame");

        response = await client.waitForMessage({
            embeds: [{ data: { title: "game game created!  [1/4]" } }],
            components: [{ components: [{}, {}, {}] }],
        });

        await bots[1].clickButton("Join / Leave", response);

        response = await client.waitForMessage({
            embeds: [{ data: { title: "game game created!  [2/4]" } }],
            components: true,
        });

        response = await client.waitForMessage({
            timeLimit: 125_000,
            embeds: [{ data: { title: "Options" } }],
            components: true,
        });
    }, 180_000);
});
