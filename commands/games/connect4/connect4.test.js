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

const goToOptions = require('../game.test');

describe("Emojis Stage", () => {

	describe("Emojis Stage Start", () => {
		it("changes the lobby embed title and sets default emojis", async () => {
			// Implementation here
		});

		it("sends a new message with the current emojis list and buttons", async () => {
			// Implementation here
		});
	});

	describe("Player reacts emoji", () => {
		it("shows an error message if the player picks a non-unique emoji", async () => {
			// Implementation here
		});

		it("shows an error message if the player picks a banned emoji", async () => {
			// Implementation here
		});

		it("updates the player emoji and edits the message when a valid emoji is picked", async () => {
			// Implementation here
		});
	});

	describe("Same buttons", () => {
		it("verifies the buttons remain the same during the stage", async () => {
			// Implementation here
		});
	});
});

describe("Game Stage", () => {

	describe("Game Stage Start", () => {
		it("changes the lobby embed title", async () => {
			// Implementation here
		});

		it("sends a new message with an empty board asking player 1 to play", async () => {
			// Implementation here
		});
	});

	describe("Current plays", () => {
		it("deletes the move and shows an error message if the column is full", async () => {
			// Implementation here
		});

		it("deletes the move, sends a new message, and proceeds to the next turn if no win is detected", async () => {
			// Implementation here
		});

		it("deletes the move, declares the player as the winner, and transitions to the end stage if a win is detected", async () => {
			// Implementation here
		});

		it("deletes the move, declares a draw, and transitions to the end stage if the board is full", async () => {
			// Implementation here
		});
	});

	describe("Current times out", () => {
		it("removes the player from the game, turns their pieces black, and proceeds to the next turn if at least 3 players remain", async () => {
			// Implementation here
		});

		it("declares the remaining player as the winner and transitions to the end stage if only 2 players are left", async () => {
			// Implementation here
		});
	});
});
