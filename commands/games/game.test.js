//Testing with UserBots will be done here

require("module-alias-jest/register");
const MatthewClient = require("@client");

const client = new MatthewClient();

const UserBot = require("@userBot");
const { Message, InteractionResponse } = require("discord.js");

const { setup, eachSetup } = require("@testSetup");

const {goToLobbyCreator, goToOptionsCreator} = require("@testHelpers");
const Game = require("./game");

const BOT_COUNT = 3;
var GAME_COMMAND = "testgame";

/** @type {UserBot[]} */
let bots = [];

/** @type {Message} */
let response;

/** @type {Game} */
let game;




/** @type {{() => Promise<[Message, Game]>}} */
let goToLobby;
/** @type {{(numPlayers: number, options?: Object) => Promise<[Message, Game]>}} */
let goToOptions;

beforeAll(async () => {
	bots = await setup(client, BOT_COUNT);
	goToLobby = goToLobbyCreator(GAME_COMMAND, bots, client);
	goToOptions = goToOptionsCreator(GAME_COMMAND, bots, client);
}, 100_000);

beforeEach(async () => {
	await eachSetup(client, bots);
});



describe("Lobby Stage", () => {
	it("Allows players to join and leave when the game command is run", async () => {
		let [response, game] = await goToLobby();

		expect(game.players.at(0).user.id).toBe(bots[0].userId)
		expect(game.players.size).toBe(1);
		expect(response.embeds.at(0).title === "game game created! [1/4]")
		expect(response.components[0].components.length).toBe(4);
		expect(response.components[0].components[0].data.label).toBe("Start");
		expect(response.components[0].components[1].data.label).toBe("Setup");
		expect(response.components[0].components[2].data.label).toBe("Join / Leave");
		expect(response.components[0].components[3].data.label).toBe("Cancel");
		expect(game.stage.name).toBe("lobby")

		await bots[1].clickButton("Join / Leave", response);
		response = await client.waitForMessageUpdate(true);
		expect(response.embeds.at(0).title).toBe("game game created! [2/4]");
		expect(game.players.at(1).user.id).toBe(bots[1].userId)
		expect(game.players.size).toBe(2);

		await bots[2].clickButton("Join / Leave", response);
		response = await client.waitForMessageUpdate(true);
		expect(response.embeds.at(0).title).toBe("game game created! [3/4]");
		expect(game.players.at(2).user.id).toBe(bots[2].userId)
		expect(game.players.size).toBe(3);

		await bots[2].clickButton("Join / Leave", response);
		response = await client.waitForMessageUpdate(true);
		expect(response.embeds.at(0).title).toBe("game game created! [2/4]");
		expect(game.players.size).toBe(2);
	});

	describe("Join/Leave Button", () => {
		it("adds user to player list if user not already in game", async () => {
			let [response, game] = await goToLobby();

			await bots[1].clickButton("Join / Leave", response);
			response = await client.waitForMessageUpdate(true);

			expect(response.embeds.at(0).title).toBe("game game created! [2/4]")
			expect(response.embeds.at(0).description.includes(`<@${bots[1].userId}>`)).toBeTruthy();
			expect(game.players.at(1).user.id).toBe(bots[1].userId)
			expect(game.players.size).toBe(2);

			await bots[2].clickButton("Join / Leave", response);
			response = await client.waitForMessageUpdate(true);

			expect(response.embeds.at(0).title).toBe("game game created! [3/4]")
			expect(response.embeds.at(0).description.includes(`<@${bots[2].userId}>`)).toBeTruthy();
			expect(game.players.at(2).user.id).toBe(bots[2].userId)
			expect(game.players.size).toBe(3);
		});

		it("removes user from player list if user already in game", async () => {
			let [response, game] = await goToLobby();

			await bots[1].clickButton("Join / Leave", response);
			response = await client.waitForMessageUpdate(true);

			await bots[1].clickButton("Join / Leave", response);
			response = await client.waitForMessageUpdate(true);

			expect(response.embeds.at(0).title).toBe("game game created! [1/4]")
			expect(response.embeds.at(0).description.includes(`<@${bots[2].userId}>`)).toBeFalsy();
			expect(game.players.at(0).user.id).toBe(bots[0].userId)
			expect(game.players.size).toBe(1);
		});
	});

	describe("Owner Clicks Join/Leave", () => {
		it("removes owner from players and sets next player to owner if at least 2 players in lobby", async () => {
			let [response, game] = await goToLobby();

			await bots[1].clickButton("Join / Leave", response);
			response = await client.waitForMessageUpdate(true);
			await bots[0].clickButton("Join / Leave", response);
			response = await client.waitForMessageUpdate(true);

			expect(response.embeds.at(0).data.title).toBe("game game created! [1/4]");
			expect(response.embeds.at(0).data.description).toBe(
				`<@${bots[1].userId}> - :crown:`
			);
			expect(game.players.at(0).user.id).toBe(bots[1].userId);
			expect(game.players.size).toBe(1);
		});
	});

	describe("Other Clicks Start, Setup, Cancel", () => {
		it("shows error for not being owner", async () => {
			let [response, game] = await goToLobby();
			
			await bots[1].clickButton("Start", response);
			let errorResponse = await client.waitForMessageCreate(true);

			expect(errorResponse.embeds.at(0).description).toBe(
				"You are not the owner of this lobby!"
			);

			await bots[1].clickButton("Setup", response);
			errorResponse = await client.waitForMessageCreate(true);

			expect(errorResponse.embeds.at(0).description).toBe(
				"You are not the owner of this lobby!"
			);

			await bots[1].clickButton("Cancel", response);
			errorResponse = await client.waitForMessageCreate(true);

			expect(errorResponse.embeds.at(0).description).toBe(
				"You are not the owner of this lobby!"
			);
		});
	});

	describe("Owner Clicks Start", () => {
		it("goes directly to Game Stage if minimum players joined", async () => {
			let [response, game] = await goToLobby();

			await bots[1].clickButton("Join / Leave", response);
			response = await client.waitForMessageUpdate(true);
			await bots[0].clickButton("Start", response);

			response = await client.waitForMessageUpdate(true);

			expect(response.embeds.at(0).title).toBe("game game ongoing!");
			expect(response.components == null);
		});

		it("shows error if fewer than minimum players", async () => {
			let [response, game] = await goToLobby();

			await bots[0].clickButton("Start", response);
			let errorResponse = await client.waitForMessageCreate(true);

			expect(errorResponse.embeds.at(0).description).toBe(
				"Not enough players to continue. (Minimum 2 players)"
			);
			expect(game.players.size).toBe(1);
		});
	});

	describe("Owner Clicks Setup", () => {
		it("transitions to Options Stage if minimum players joined", async () => {
			let [response, game] = await goToLobby();

			await bots[1].clickButton("Join / Leave", response);
			oldResponse = await client.waitForMessageUpdate(true);
			await bots[0].clickButton("Setup", oldResponse);

			response = await client.waitForMessageUpdate(true);

			//player list should not change
			expect(response.embeds.at(0).title).toBe("game game configuring...");
			expect(response.embeds.at(0).description).toBe(oldResponse.embeds.at(0).description)
			expect(response.embeds.at(1).description.includes("1. Example setting - ")).toBeTruthy();
			expect(response.embeds.at(1).description.includes(`<@${bots[0].userId}>, change options`)).toBeTruthy();
			expect(game.players.size).toBe(2);
			expect(response.components[0].components.some(c => c.data.label === "Continue")).toBeTruthy();
			expect(response.components[0].components.some(c => c.data.label === "Leave")).toBeTruthy();
			expect(response.components[0].components.some(c => c.data.label === "Cancel")).toBeTruthy();
		});

		it("shows error if fewer than minimum players", async () => {
			let [response, game] = await goToLobby();

			await bots[0].clickButton("Setup", response);
			let errorResponse = await client.waitForMessageCreate(true);

			expect(errorResponse.embeds.at(0).description).toBe(
				"Not enough players to continue. (Minimum 2 players)"
			);
			expect(game.players.size).toBe(1);
		});
	});

	describe("Owner Clicks Cancel", () => {
		it("closes lobby and does not start game", async () => {
			let [response, game] = await goToLobby();

			await bots[0].clickButton("Cancel", response);
			response = await client.waitForMessageUpdate({components: []});

			expect(response.embeds.at(0).title).toBe("game game cancelled");
			expect(response.embeds.at(0).description).toBe("Blame the leader");
			expect(game.players.size).toBe(1);
		});
	});
});

describe("Options Stage", () => {
	it("allows the owner to change and set options for the game", async () => {
		let [response, game] = await goToOptions(3);
			
		expect(response.embeds.at(0).title).toBe("game game configuring...");
		
		expect(response.embeds.at(1).title).toBe("Options");
		expect(response.embeds.at(1).description.includes(`<@${bots[0].userId}>`)).toBeTruthy();
		expect(response.embeds.at(1).description.includes("Example setting - **5**")).toBeTruthy();

		expect(response.components.length).toBe(1);
		expect(response.components.at(0).components.length).toBe(4);
		expect(response.components[0].components.some(c => c.data.label === "Start")).toBeTruthy();
		expect(response.components[0].components.some(c => c.data.label === "Continue")).toBeTruthy();
		expect(response.components[0].components.some(c => c.data.label === "Leave")).toBeTruthy();
		expect(response.components[0].components.some(c => c.data.label === "Cancel")).toBeTruthy();

		expect(game.stage.name).toBe("options")

		await bots[0].sendMessage("1");
		response = await client.waitForMessageUpdate(true);
		expect(response.embeds.at(1).title).toBe("Editing Example setting")
		expect(response.embeds.at(1).description).toBe("This is an example")

		await bots[0].sendMessage("7");
		response = await client.waitForMessageUpdate(true);
		expect(response.embeds.at(1).title).toBe("Options")
		expect(response.embeds.at(1).description.includes("Example setting - **7**")).toBeTruthy();

	})

	describe("Options Stage Start", () => {
		it("changes lobby embed title, removes buttons, and sends new message with options list and buttons", async () => {
			let [response, game] = await goToOptions(3);
			
			expect(response.embeds.at(0).title).toBe("game game configuring...");
			expect(response.components.length).toBe(1);
			expect(response.components.at(0).components.length).toBe(4);
			expect(response.embeds.at(1).title).toBe("Options");
			expect(
				response.embeds.at(1).description.includes(`<@${bots[0].userId}>`)
			).toBeTruthy();
			expect(game.stage.name).toBe("options")
		});
	});

	describe("Owner Clicks Leave", () => {
		it("cancels game if less than 3 players and deletes options message", async () => {
			let [response, game] = await goToOptions(2);

			await bots[0].clickButton("Leave", response);
			response = await client.waitForMessageUpdate(true);
			
			expect(response.embeds.length).toBe(1);
			expect(response.embeds.at(0).title).toBe("game game cancelled");

			
		});

		it("removes owner from players, sets next player as owner, and updates message if at least 3 players", async () => {
			let [response, game] = await goToOptions(3);

			await bots[0].clickButton("Leave", response);
			response = await client.waitForMessageUpdate(true);
			
			expect(
				response.embeds.at(0).description.includes(`<@${bots[0].userId}>`)
			).toBeFalsy();
			expect(
				response.embeds.at(0).description.includes(`<@${bots[1].userId}> - :crown:`)
			).toBeTruthy();
			expect(
				response.embeds.at(0).description.includes(`<@${bots[2].userId}>`)
			).toBeTruthy();

			expect(
				response.embeds.at(1).description.includes(`<@${bots[0].userId}>`)
			).toBeFalsy();
			expect(
				response.embeds.at(1).description.includes(`<@${bots[1].userId}>`)
			).toBeTruthy();
		});
	});

	describe("Other Clicks Leave", () => {
		it("cancels game if less than 3 players and removes options embed", async () => {
			let [response, game] = await goToOptions(2);

			await bots[1].clickButton("Leave", response);
			response = await client.waitForMessageUpdate(true);
			
			expect(response.embeds.length).toBe(1);
			expect(response.embeds.at(0).title).toBe("game game cancelled");
		});

		it("updates lobby message if at least 3 players", async () => {
			let [response, game] = await goToOptions(3);

			await bots[1].clickButton("Leave", response);
			response = await client.waitForMessageUpdate(true);
			
			expect(
				response.embeds.at(0).description.includes(`<@${bots[0].userId}>`)
			).toBeTruthy();
			expect(
				response.embeds.at(0).description.includes(`<@${bots[1].userId}> - :crown:`)
			).toBeFalsy();
			expect(
				response.embeds.at(0).description.includes(`<@${bots[2].userId}>`)
			).toBeTruthy();
		});
	});

	describe("Other Clicks Start, Continue, Cancel", () => {
		it("shows error for not being owner", async () => {
			let [response, game] = await goToOptions(3);
			
			await bots[1].clickButton("Start", response);
			let errorResponse = await client.waitForMessageCreate(true);

			expect(errorResponse.embeds.at(0).description).toBe(
				"You are not the owner of this lobby!"
			);

			await bots[1].clickButton("Continue", response);
			errorResponse = await client.waitForMessageCreate(true);

			expect(errorResponse.embeds.at(0).description).toBe(
				"You are not the owner of this lobby!"
			);

			await bots[1].clickButton("Cancel", response);
			errorResponse = await client.waitForMessageCreate(true);

			expect(errorResponse.embeds.at(0).description).toBe(
				"You are not the owner of this lobby!"
			);
		});
	});

	describe("Owner Clicks Start", () => {
		it("goes directly to Game Stage", async () => {
			let [response, game] = await goToOptions(2);
			await bots[0].clickButton("Start", response);

			response = await client.waitForMessageUpdate(true);

			expect(response.embeds.at(0).title).toBe("game game ongoing!");
			expect(response.components == null);
		});
	});

	describe("Owner Clicks Continue", () => {
		it("removes embed and transitions to next stage", async () => {
			let [response, game] = await goToOptions(3);

			await bots[0].clickButton("Continue", response);
			response = await client.waitForMessageUpdate(true);

			expect(response.embeds.length).toBe(2);
			expect(response.embeds.at(0).title).toBe("game game ongoing!");
			expect(response.embeds.at(1).title).toBe("Game");
			expect(response.embeds.at(1).description).toBe("Ending in 5 seconds...");
		});
	});

	describe("Owner Clicks Cancel", () => {
		it("closes lobby, options embed removed", async () => {
			let [response, game] = await goToOptions(3);
			
			await bots[0].clickButton("Cancel", response);
			response = await client.waitForMessageUpdate(true);
			
			expect(response.embeds.length).toBe(1);
			expect(response.embeds.at(0).title).toBe("game game cancelled");
			expect(response.embeds.at(0).description).toBe("Blame the leader");
		});
	});

	describe("Owner Types Value", () => {
		it("deletes owner message and edits to show option if no option selected and valid value", async () => {
			let [response, game] = await goToOptions(3);
			await bots[0].sendMessage("1");
			let ownerDelete;
			[ownerDelete, response] = await Promise.all([
				client.waitForMessageDelete({author: { id: bots[0].userId }}),
				client.waitForMessageUpdate({}),
			]);

			expect(response.embeds.at(1).title).toBe("Editing Example setting");
			expect(response.embeds.at(1).description).toBe("This is an example");
		});

		it("deletes owner message and edits back to option list if option selected and valid value", async () => {
			let [response, game] = await goToOptions(3);
			bots[0].sendMessage("1");
			let ownerDelete;
			[ownerDelete, response] = await Promise.all([
				client.waitForMessageDelete({content: "1", author: {id: bots[0].userId}},true),
				client.waitForMessageUpdate(true),
			]);
			bots[0].sendMessage("5");
			[ownerDelete, response] = await Promise.all([
				client.waitForMessageDelete({}),
				client.waitForMessageUpdate(true),
			]);

			expect(
				response.embeds.at(1).description.includes("Example setting - **5**")
			).toBeTruthy();
		});
 
		it("ignores invalid value", async () => {
			let [response, game] = await goToOptions(3);

			bots[0].sendMessage("a");
			try {
				let result = await client.waitForMessageUpdate(true);
				console.log(JSON.stringify(result));
				return new Error("Message received when not supposed to");
			} catch (err) {}

			bots[0].sendMessage("4");
			try {
				let result = await client.waitForMessageUpdate(true);
				console.log(JSON.stringify(result));
				return new Error("Message received when not supposed to");
			} catch (err) {}

			bots[0].sendMessage("1");
			let ownerDelete;
			[ownerDelete, response] = await Promise.all([
				client.waitForMessageDelete({}),
				client.waitForMessageUpdate(true),
			]);

			bots[0].sendMessage("21");
			try {
				let result = await client.waitForMessageUpdate(true);
				console.log(JSON.stringify(result));
				return new Error("Message received when not supposed to");
			} catch (err) {}
		});
	});

	describe("Other Types Value", () => {
		it("ignores value", async () => {
			let [response, game] = await goToOptions(3);
			bots[1].sendMessage("1");
			//no messageUpdate should be sent
			try {
				let result = await client.waitForMessageUpdate(true);
				console.log(JSON.stringify(result));
				return new Error("Message received when not supposed to");
			} catch {}
		});
	});
});
