//Testing with UserBots will be done here

require("module-alias-jest/register");
const MatthewClient = require("@client");
const client = new MatthewClient();

const UserBot = require("@userBot");
const { Message } = require("discord.js");
const BOT_COUNT = 3;

/** @type {UserBot[]} */
let bots;

/** @type {Message} */
let response;

const { setup, eachSetup } = require("@testSetup");
beforeAll(async () => {
    bots = await setup(client, 3);
}, 100_000);

beforeEach(async () => {
    await eachSetup(client, bots);
});
afterAll(async () => {
    bots.forEach((bot) => bot.browser.close());
});

/** fast tracks to options page for testing */
/*
async function goToOptions(bot_count) {
    await bots[0].sendCommand("connect4", "MatthewBot2");

    response = await client.waitForMessage({
        embeds: [{ data: { title: "Connect4 game created!  [1/6]" } }],
        components: [{ components: [{}, {}, {}] }],
    });

    for (var i = 1; i < bot_count; i++) {
        await bots[i].clickButton("Join / Leave", response);

        response = await client.waitForMessage({
            embeds: [
                { data: { title: `Connect4 game created!  [${i + 1}/6]` } },
            ],
            components: true,
        });
    }

    await bots[0].clickButton("Start", response);
}*/



describe("Options Stage", () => {
    describe("Options Stage Start", () => {
        it("changes lobby embed title, removes buttons, and sends new message with options list and buttons", async () => {
            // Test implementation
        });
    });

    describe("Owner Clicks Leave", () => {
        it("cancels game if less than 3 players and deletes options message", async () => {
            // Test implementation
        });

        it("removes owner from players, sets next player as owner, and updates options message if at least 3 players", async () => {
            // Test implementation
        });
    });

    describe("Other Clicks Leave", () => {
        it("cancels game if less than 3 players and deletes options message", async () => {
            // Test implementation
        });

        it("updates lobby and options message with new owner if at least 3 players", async () => {
            // Test implementation
        });
    });

    describe("Owner Clicks Continue", () => {
        it("deletes message and transitions to emojis stage", async () => {
            // Test implementation
        });
    });

    describe("Other Clicks Continue", () => {
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

    describe("Owner Types Value", () => {
        it("deletes owner message and edits to show option if no option selected and valid value", async () => {
            // Test implementation
        });

        it("deletes owner message and edits back to option list if option selected and valid value", async () => {
            // Test implementation
        });

        it("ignores invalid value", async () => {
            // Test implementation
        });
    });

    describe("Other Types Value", () => {
        it("ignores value", async () => {
            // Test implementation
        });
    });
});

describe("Emojis Stage", () => {
    describe("Emojis Stage Start", () => {
        it("changes lobby embed title, sets default emojis, and sends new message with emojis list and buttons", async () => {
            // Test implementation
        });
    });

    describe("Player Reacts Emoji", () => {
        it("shows error for non-unique emoji", async () => {
            // Test implementation
        });

        it("shows error for banned emoji", async () => {
            // Test implementation
        });

        it("updates player emoji and edits message for valid emoji", async () => {
            // Test implementation
        });
    });

    // Add tests for "same buttons" if necessary
});

describe("Game Stage", () => {
    describe("Game Stage Start", () => {
        it("changes lobby embed title and sends new message with empty board asking p1 to play", async () => {
            // Test implementation
        });
    });

    describe("Current Plays", () => {
        it("deletes move and shows error if column is full", async () => {
            // Test implementation
        });

        it("deletes move, sends new message for next turn if no win detected", async () => {
            // Test implementation
        });

        it("deletes move, player wins, transitions to end stage if win detected", async () => {
            // Test implementation
        });

        it("deletes move, draws game, transitions to end stage if board full", async () => {
            // Test implementation
        });
    });

    describe("Current Times Out", () => {
        it("player loses, next turn, and turns all timed out player pieces black if at least 3 players left", async () => {
            // Test implementation
        });

        it("game ends, remaining player wins if only 2 players", async () => {
            // Test implementation
        });
    });
});

describe("End Stage", () => {
    describe("End Stage Start", () => {
        it("sends win embed with buttons and edits lobby title if player won", async () => {
            // Test implementation
        });

        it("sends draw embed with buttons and edits lobby title if game drawn", async () => {
            // Test implementation
        });
    });

    describe("Click Play Again", () => {
        it("creates new game with person who clicked button as owner", async () => {
            // Test implementation
        });
    });
});
