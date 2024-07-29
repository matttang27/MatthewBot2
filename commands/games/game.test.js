//Testing with UserBots will be done here

require("module-alias-jest/register");
const MatthewClient = require("@client");

const client = new MatthewClient();

const UserBot = require("@userBot");
const { Message, InteractionResponse } = require("discord.js");
const BOT_COUNT = 3;

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

/**
 * Goes directly to options screen by having players automatically join the lobby
 * @param {string} command the command to input
 * @param {number} num_players the number of players to join lobby
 * @returns {[InteractionResponse,InteractionResponse] | Error}
 * returns the main response and options response or an error if a bug occured.
 */
async function gotoStage(stage, command, num_players) {
    await bots[0].sendCommand(command);
    let response = await client.waitForMessage({
        embeds: [{}],
        components: [{ components: [{}, {}, {}] }],
    });

    for (var i = 1; i < num_players; i++) {
        await bots[1].clickButton("Join / Leave", response);

        response = await client.waitForMessage({
            embeds: [{}],
            components: [{ components: [{}, {}, {}] }],
        });
    }

    await bots[1].clickButton("Join / Leave", response);

    response = await client.waitForMessage({
        embeds: [{}],
        components: [{ components: [{}, {}, {}] }],
    });

    if (
        !response.embeds.at(0).data.title.includes(`created! [${num_players}`)
    ) {
        return new Error(
            `${
                response.embeds.at(0).data.title
            } does not include expected players`
        );
    }

    await bots[0].clickButton("Start", response);

    let optionResponse = await client.waitForMessage({
        embeds: [{ data: { title: "Options" } }],
        components: true,
    });

    return [response, optionResponse];
}
describe("Lobby Stage", () => {
    describe("Game Command", () => {
        it("creates a lobby with player list and buttons", async () => {
            await bots[0].sendCommand("testgame");
            let response = await client.waitForMessage({
                embeds: [{ data: { title: "game game created! [1/4]" } }],
                components: [
                    {
                        components: [
                            { data: { label: "Start" } },
                            { data: { label: "Join / Leave" } },
                            { data: { label: "Cancel" } },
                        ],
                    },
                ],
            });
        });
    });

    describe("Other Clicks Join/Leave", () => {
        it("adds user to player list if user not already in game", async () => {
            await bots[0].sendCommand("testgame");
            response = await client.waitForNextMessage();
            await bots[1].clickButton("Join / Leave", response);
            response = await client.waitForMessage({
                embeds: [{ data: { title: "game game created! [2/4]" } }],
                components: true,
            });

            expect(
                response.embeds
                    .at(0)
                    .data.title.includes(`<@${bots[1].userId}>`)
            );
        });

        it("removes user from player list if user already in game", async () => {
            await bots[0].sendCommand("testgame");
            response = await client.waitForNextMessage();
            await bots[1].clickButton("Join / Leave", response);
            response = await client.waitForNextMessage();
            await bots[1].clickButton("Join / Leave", response);
            response = await client.waitForMessage({
                embeds: [{ data: { title: "game game created! [1/4]" } }],
                components: true,
            });
        });
    });

    describe("Owner Clicks Join/Leave", () => {
        it("removes owner from players and sets next player to owner if at least 2 players in lobby", async () => {
            await bots[0].sendCommand("testgame");
            response = await client.waitForNextMessage();
            await bots[1].clickButton("Join / Leave", response);
            response = await client.waitForNextMessage();
            await bots[0].clickButton("Join / Leave", response);
            response = await client.waitForMessage({
                embeds: [{}],
                components: true,
            });
            expect(
                response.embeds.at(0).data.title == "game game created! [1/4]"
            );
            expect(
                response.embeds
                    .at(0)
                    .data.description.includes(`<@${bots[0].userId}> - :crown:`)
            );
        });

        it("cancels game if only owner in lobby", async () => {
            await bots[0].sendCommand("testgame");
            response = await client.waitForNextMessage();
            await bots[0].clickButton("Join / Leave", response);
            response = await client.waitForMessage({
                embeds: [{}],
                components: [],
            });

            expect(response.embeds.at(0).data.title == "game game cancelled");
        });
    });

    describe("Owner Clicks Start", () => {
        it("transitions to Options Stage if minimum players joined", async () => {
            await bots[0].sendCommand("testgame");
            response = await client.waitForNextMessage();
            await bots[1].clickButton("Join / Leave", response);
            oldResponse = await client.waitForNextMessage();
            await bots[0].clickButton("Start", oldResponse);

            [response,optionsResponse] = await Promise.all([
                    client.waitForMessage({
                        embeds: [{ data: { title: "game game: configuring..." }}],
                        components: [],
                    }),
                    client.waitForMessage({
                        embeds: [{ data: { title: "Options" } }],
                        components: [],
                    })
                ]);

            //player list should not change
            
            expect(response.embeds.at(0).description).toBe(oldResponse.embeds.at(0).description)
            expect(optionsResponse.embeds.at(0).description.includes("1. Example setting - ")).toBeTruthy()
            expect(optionsResponse.embeds.at(0).description.includes(`<@${bots[0].userId}>, change settings`))
        });

        it("shows error if fewer than minimum players", async () => {
            await bots[0].sendCommand("testgame");
            response = await client.waitForNextMessage();
            await bots[0].clickButton("Start", response);
            response = await client.waitForMessage({
                embeds: [{}],
                components: []
            });

            expect(response.embeds.at(0).description == "Not enough players to start. (Minimum 2 players)")
        });
    });

    describe("Other Clicks Start", () => {
        it("shows error for not being owner", async () => {
            // Test implementation
        });
    });

    describe("Owner Clicks Cancel", () => {
        it("closes lobby and does not start game", async () => {
            // Test implementation
        });
    });

    describe("Other Clicks Cancel", () => {
        it("shows error for not being owner", async () => {
            // Test implementation
        });
    });
});

describe("testgame command", () => {
    it("runs a normal game properly", async () => {
        let { response, optionResponse } = gotoStage("testgame", 2);

        expect(
            response.embeds
                .at(0)
                .data.description.includes("Example setting - **5**")
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
            response.embeds
                .at(0)
                .data.description.includes("Example setting - **7**")
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
