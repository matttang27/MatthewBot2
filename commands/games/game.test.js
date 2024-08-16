//Testing with UserBots will be done here

require("module-alias-jest/register");
const MatthewClient = require("@client");

const client = new MatthewClient();

const UserBot = require("@userBot");
const { Message, InteractionResponse } = require("discord.js");
const BOT_COUNT = 3;
var GAME_COMMAND = "testgame";

/** @type {UserBot[]} */
let bots = [];

/** @type {Message} */
let response;

const { setup, eachSetup } = require("@testSetup");

const {goToOptionsCreator, goToOptionsBase} = require("@testHelpers");

let goToOptions;
beforeAll(async () => {
	bots = await setup(client, BOT_COUNT);
	goToOptions = goToOptionsCreator(GAME_COMMAND, bots, client);
}, 100_000);

beforeEach(async () => {
	await eachSetup(client, bots);
});



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

			expect(response.embeds.at(0).data.title.includes(`<@${bots[1].userId}>`));
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

			if (
				!response.embeds.at(0).data.description.includes(`<@${bots[1].userId}> - :crown:`)
			) {
				console.log(response.embeds.at(0).data.description);
			}

			expect(response.embeds.at(0).data.title).toBe("game game created! [1/4]");
			expect(response.embeds.at(0).data.description).toBe(
				`<@${bots[1].userId}> - :crown:`
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

			expect(response.embeds.at(0).data.title).toBe("game game cancelled");
		});
	});

	describe("Owner Clicks Start", () => {
		it("transitions to Options Stage if minimum players joined", async () => {
			await bots[0].sendCommand("testgame");
			response = await client.waitForMessageCreate(true);
			await bots[1].clickButton("Join / Leave", response);
			oldResponse = await client.waitForMessageUpdate(true);
			await bots[0].clickButton("Start", oldResponse);

			[response, optionsResponse] = await Promise.all([
				client.waitForMessageUpdate({
					embeds: [{ data: { title: "game game configuring..." } }],
					components: [],
				}),
				client.waitForMessageUpdate({
					embeds: [{ data: { title: "Options" } }],
					components: [],
				}),
			]);

			//player list should not change

			expect(response.embeds.at(0).description).toBe(
				oldResponse.embeds.at(0).description
			);
			expect(
				optionsResponse.embeds.at(0).description.includes("1. Example setting - ")
			).toBeTruthy();
			expect(
				optionsResponse.embeds
					.at(0)
					.description.includes(`<@${bots[0].userId}>, change settings`)
			).toBeTruthy();
		});

		it("shows error if fewer than minimum players", async () => {
			await bots[0].sendCommand("testgame");
			response = await client.waitForNextMessage();
			await bots[0].clickButton("Start", response);
			response = await client.waitForMessage({
				embeds: [{}],
				components: [],
			});

			expect(response.embeds.at(0).description).toBe(
				"Not enough players to start. (Minimum 2 players)"
			);
		});
	});

	describe("Other Clicks Start", () => {
		it("shows error for not being owner", async () => {
			await bots[0].sendCommand("testgame");
			response = await client.waitForNextMessage();
			await bots[1].clickButton("Start", response);
			response = await client.waitForMessage({
				embeds: [{}],
				components: [],
			});

			expect(response.embeds.at(0).description).toBe(
				"You are not the owner of this lobby!"
			);
		});
	});

	describe("Owner Clicks Cancel", () => {
		it("closes lobby and does not start game", async () => {
			await bots[0].sendCommand("testgame");
			response = await client.waitForMessageCreate(true);
			await bots[0].clickButton("Cancel", response);
			response = await client.waitForMessageUpdate({ embeds: [{}] }, true);

			expect(response.embeds.at(0).title).toBe("game game cancelled");
			expect(response.embeds.at(0).description).toBe("Blame the leader");
		});
	});

	describe("Other Clicks Cancel", () => {
		it("shows error for not being owner", async () => {
			await bots[0].sendCommand("testgame");
			response = await client.waitForNextMessage();
			await bots[1].clickButton("Cancel", response);
			response = await client.waitForMessage({
				embeds: [{}],
				components: [],
			});

			expect(response.embeds.at(0).description == "You are not the owner of this lobby!");
		});
	});
});

describe("Options Stage", () => {
	describe("Options Stage Start", () => {
		it("changes lobby embed title, removes buttons, and sends new message with options list and buttons", async () => {
			let [response, optionsResponse] = await goToOptions(3);
			
			expect(response.embeds.at(0).title).toBe("game game configuring...");
			expect(response.components.length).toBe(0);
			expect(optionsResponse.components.at(0).components.length).toBe(3);
			expect(optionsResponse.embeds.at(0).title).toBe("Options");
			expect(
				optionsResponse.embeds.at(0).description.includes(`<@${bots[0].userId}>`)
			).toBeTruthy();
		});
	});

	describe("Owner Clicks Leave", () => {
		it("cancels game if less than 3 players and deletes options message", async () => {
			let [mainResponse, optionsResponse] = await goToOptions(2);
			await bots[0].clickButton("Leave Game", optionsResponse);
			[mainResponse, optionsResponse] = await Promise.all([
				client.waitForMessageUpdate(
					{ embeds: [{ data: { title: "game game cancelled" } }] },
					true
				),
				client.waitForMessageDelete({
					embeds: [{ data: { title: "Options" } }],
				}),
			]);

			
		});

		it("removes owner from players, sets next player as owner, and updates options message if at least 3 players", async () => {
			let [mainResponse, optionsResponse] = await goToOptions(3);
			await bots[0].clickButton("Leave Game", optionsResponse);
			[mainResponse, optionsResponse] = await Promise.all([
				client.waitForMessageUpdate(
					{
						embeds: [{ data: { title: "game game configuring..." } }],
					},
					true
				),
				client.waitForMessageUpdate({
					embeds: [{ data: { title: "Options" } }],
				}),
			]);

			expect(
				mainResponse.embeds.at(0).description.includes(`<@${bots[0].userId}>`)
			).toBeFalsy();
			expect(
				mainResponse.embeds.at(0).description.includes(`<@${bots[1].userId}> - :crown:`)
			).toBeTruthy();
			expect(
				mainResponse.embeds.at(0).description.includes(`<@${bots[2].userId}>`)
			).toBeTruthy();

			expect(
				optionsResponse.embeds.at(0).description.includes(`<@${bots[0].userId}>`)
			).toBeFalsy();
			expect(
				optionsResponse.embeds.at(0).description.includes(`<@${bots[1].userId}>`)
			).toBeTruthy();
		});
	});

	describe("Other Clicks Leave", () => {
		it("cancels game if less than 3 players and deletes options message", async () => {
			let [mainResponse, optionsResponse] = await goToOptions(2);
			await bots[1].clickButton("Leave Game", optionsResponse);
			[mainResponse, optionsResponse] = await Promise.all([
				client.waitForMessageUpdate(
					{ embeds: [{ data: { title: "game game cancelled" } }] },
					true
				),
				client.waitForMessageDelete({
					embeds: [{ data: { title: "Options" } }],
				}),
			]);
		});

		it("updates lobby message if at least 3 players", async () => {
			let [mainResponse, optionsResponse] = await goToOptions(3);
			bots[1].clickButton("Leave Game", optionsResponse);

			mainResponse = await client.waitForMessageUpdate(
				{ embeds: [{ data: { title: "game game configuring..." } }] },
				true
			);

			expect(
				mainResponse.embeds.at(0).description.includes(`<@${bots[0].userId}> - :crown:`)
			).toBeTruthy();
			expect(
				mainResponse.embeds.at(0).description.includes(`<@${bots[1].userId}> - :crown:`)
			).toBeFalsy();
			expect(
				mainResponse.embeds.at(0).description.includes(`<@${bots[2].userId}>`)
			).toBeTruthy();
		});
	});

	describe("Owner Clicks Continue", () => {
		it("deletes message and transitions to setup stage", async () => {
			let [mainResponse, optionsResponse] = await goToOptions(3);
			await bots[0].clickButton("Continue", optionsResponse);
			let [setupResponse, optionsDelete] = await Promise.all([
				client.waitForMessageUpdate(
					{
						embeds: [{ data: { title: "game game setting up..." } }],
					},
					true
				),
				client.waitForMessageDelete({
					embeds: [{ data: { title: "Options" } }],
				}),
			]);
		});
	});

	describe("Other Clicks Continue", () => {
		it("shows error for not being owner", async () => {
			let [mainResponse, optionsResponse] = await goToOptions(2);
			await bots[1].clickButton("Continue", optionsResponse);

			response = await client.waitForMessageCreate(true);

			expect(response.embeds.at(0).description).toBe(
				"You are not the owner of this lobby!"
			);
		});
	});

	describe("Owner Clicks Cancel", () => {
		it("closes lobby, option message deleted", async () => {
			let [mainResponse, optionsResponse] = await goToOptions(2);
			await bots[0].clickButton("Cancel Game", optionsResponse);
			[mainResponse, optionsResponse] = await Promise.all([
				client.waitForMessageUpdate(
					{ embeds: [{ data: { title: "game game cancelled" } }] },
					true
				),
				client.waitForMessageDelete({
					embeds: [{ data: { title: "Options" } }],
				}),
			]);

			expect(mainResponse.embeds.at(0).description).toBe("Blame the leader");
		});
	});

	describe("Other Clicks Cancel", () => {
		it("shows error for not being owner", async () => {
			let [mainResponse, optionsResponse] = await goToOptions(2);
			bots[1].clickButton("Cancel Game", optionsResponse);

			response = await client.waitForMessageCreate(true);

			expect(response.embeds.at(0).description).toBe(
				"You are not the owner of this lobby!"
			);

			expect(response.embeds.at(0).description).toBe(
				"You are not the owner of this lobby!"
			);
		});
	});

	describe("Owner Types Value", () => {
		it("deletes owner message and edits to show option if no option selected and valid value", async () => {
			let [mainResponse, optionsResponse] = await goToOptions(2);
			await bots[0].sendMessage("1");
			let ownerDelete;
			[ownerDelete, optionsResponse] = await Promise.all([
				client.waitForMessageDelete({ author: { id: bots[0].userId } }),
				client.waitForMessageUpdate(
					{
						embeds: [{ data: { title: "Editing Example setting" } }],
					},
					true
				),
			]);

			expect(optionsResponse.embeds.at(0).description).toBe("This is an example");
		});

		it("deletes owner message and edits back to option list if option selected and valid value", async () => {
			let [mainResponse, optionsResponse] = await goToOptions(2);
			bots[0].sendMessage("1");
			let ownerDelete;
			[ownerDelete, optionsResponse] = await Promise.all([
				client.waitForMessageDelete({}),
				client.waitForMessageUpdate(true),
			]);
			bots[0].sendMessage("5");
			[ownerDelete, optionsResponse] = await Promise.all([
				client.waitForMessageDelete({}),
				client.waitForMessageUpdate({
					embeds: [{ data: { title: "Options" } }],
				}),
			]);

			expect(
				optionsResponse.embeds.at(0).description.includes("Example setting - **5**")
			).toBeTruthy();
		});
 
		it("ignores invalid value", async () => {
			let [mainResponse, optionsResponse] = await goToOptions(2);

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
			[ownerDelete, optionsResponse] = await Promise.all([
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
			let [mainResponse, optionsResponse] = await goToOptions(2);
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

module.exports = goToOptionsCreator;