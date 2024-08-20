//Testing with UserBots will be done here

require("module-alias-jest/register");
const MatthewClient = require("@client");

const client = new MatthewClient();

const UserBot = require("@userBot");
const { Message, InteractionResponse } = require("discord.js");
const BOT_COUNT = 3;
var GAME_COMMAND = "connect4";
/** @type {UserBot[]} */
let bots = [];

/** @type {Message} */
let response;

const {goToOptionsCreator} = require("@testHelpers");


const { setup, eachSetup } = require("@testSetup");
const Game = require("../game");
const Connect4Game = require("./connect4game");

/** @type {function(number): Promise<[Message, Connect4Game]>} */
let goToOptions;

beforeAll(async () => {
	bots = await setup(client, BOT_COUNT);
	goToOptions = goToOptionsCreator(GAME_COMMAND, bots, client);
}, 100_000);

beforeEach(async () => {
	await eachSetup(client, bots);
});

/**
 * 
 * @param {number} numPlayers 
 * @param {Object<string,any>} [options={}]
 * @param {Object<string,string>} [emojis={}]
 * @returns {Promise<[Message,Connect4Game]>}
 */
async function goToConnect4Emojis(numPlayers,options={},emojis={}) {
	try {
		let [response, game] = await goToOptions(numPlayers, options);

		await bots[0].clickButton("Continue", response);
		response = await client.waitForMessageUpdate(true);

		for (player in emojis) {
			if (! game.players.has(player)) {throw Error(`${player} not in player list`)};
			game.players.get(player).other.emoji = emojis[player];
		}

		await game.editEmojiEmbed(true);

		return [response, game];
	} catch (err) {
		console.error(err);
		return [err, "bleh"];
	}
}

/**
 * 
 * @param {Number} numPlayers 
 * @param {{string: any}} options
 * @param {{string: string}} emojis
 * @returns {Promise<[Message,Connect4Game]>} the message and the created connect4game.
 */
async function goToConnect4Game(numPlayers, options={}, emojis={}) {
	try {
		let [response, game] = await goToConnect4Emojis(numPlayers, options,);
		await bots[0].clickButton("Continue", response);
		response = await client.waitForMessageUpdate(true);

		return [response, game];
	}
	catch (err) {
		console.error(err);
		return [err,"bleh"]
	}
    
}

describe("Emojis Stage", () => {
	describe("goToConnect4Emojis", () => {
		it("sets default emojis if emojis argument is empty", async () => {
			let [response,game] = await goToConnect4Emojis(2);
			expect(response.embeds.at(0).title).toBe("Connect4 game setting emojis...") 
            expect(response.embeds.at(1).title).toBe("Set emojis");
			console.log(response.embeds.at(1).description);
			expect(response.embeds.at(1).description.includes(`<@${bots[0].userId}>`))
			expect(game.stage.name === "emojis");
		})

		it("sets custom emojis for emoji arguments", async () => {
			let [response,game] = await goToConnect4Emojis(3,{},{[bots[0].userId]:"🟢"});

			expect(response.embeds.at(1).description.includes(`<@${bots[0].userId}> - 🟢`)).toBeTruthy();
		})
	})

	describe("Player reacts emoji", () => {
		it("removes reaction if the player picks a non-unique emoji, a banned emoji, or a non-player reacted.", async () => {
			let [response,game] = await goToConnect4Emojis(2);
			await bots[1].addReaction("blue_circle", response);
			let reactionRemove = await client.waitForReactionRemove([{},{id: bots[1].userId}]);

			await bots[0].addReaction("black_circle", response);
			reactionRemove = await client.waitForReactionRemove([{},{id: bots[0].userId}]);

			await bots[2].addReaction("green_circle", response);
			reactionRemove = await client.waitForReactionRemove([{},{id: bots[2].userId}]);
		});

		it("updates the player emoji and edits the message when a valid emoji is picked", async () => {
			let [response,game] = await goToConnect4Emojis(3);
			await bots[0].addReaction("green_circle", response);
			emojiResponse = await client.waitForMessageUpdate(true);
			expect(emojiResponse.embeds.at(0).description.includes("green_circle"));

			//custom emoji:

			await bots[0].addReaction("aplusrank", response)
			emojiResponse = await client.waitForMessageUpdate(true);
			expect(emojiResponse.embeds.at(0).description.includes("aplusrank"));
		});
	});

	describe("Buttons are the same as options stage, and update emoji response accordingly.", () => {
		describe("Owner Clicks Leave", () => {
			it("cancels game if less than 3 players and deletes options message", async () => {
				let [mainResponse, emojiResponse] = await goToEmojis(2);
				await bots[0].clickButton("Leave Game", emojiResponse);
				[mainResponse, emojiResponse] = await Promise.all([
					client.waitForMessageUpdate(
						{ embeds: [{ data: { title: "Connect4 game cancelled" } }] },
						true
					),
					client.waitForMessageDelete({
						embeds: [{ data: { title: "Set emojis" } }],
					}),
				]);
	
				
			});
	
			it("removes owner from players, sets next player as owner, and updates lobby & emoji message if at least 3 players", async () => {
				let [mainResponse, emojisResponse] = await goToEmojis(3);
				await bots[0].clickButton("Leave Game", emojisResponse);
				[mainResponse, emojisResponse] = await Promise.all([
					client.waitForMessageUpdate(
						{
							embeds: [{ data: { title: "Connect4 game setting up..." } }],
						},
						true
					),
					client.waitForMessageUpdate({
						embeds: [{ data: { title: "Set emojis" } }],
					}),
				]);
	
				expect(mainResponse.embeds.at(0).description.includes(`<@${bots[0].userId}>`)).toBeFalsy();
				expect(mainResponse.embeds.at(0).description.includes(`<@${bots[1].userId}> - :crown:`)).toBeTruthy();
				expect(mainResponse.embeds.at(0).description.includes(`<@${bots[2].userId}>`)).toBeTruthy();
	
				expect(emojisResponse.embeds.at(0).description.includes(`<@${bots[0].userId}>`)).toBeFalsy();
				expect(emojisResponse.embeds.at(0).description.includes(`<@${bots[1].userId}>`)).toBeTruthy();
			});
		});
	
		describe("Other Clicks Leave", () => {
			it("cancels game if less than 3 players and deletes options message", async () => {
				let [mainResponse, emojisResponse] = await goToEmojis(2);
				await bots[1].clickButton("Leave Game", emojisResponse);
				[mainResponse, emojisResponse] = await Promise.all([
					client.waitForMessageUpdate(
						{ embeds: [{ data: { title: "Connect4 game cancelled" } }] },
						true
					),
					client.waitForMessageDelete({
						embeds: [{ data: { title: "Set emojis" } }],
					}),
				]);
			});
	
			it("updates emoji list and lobby message if at least 3 players", async () => {
				let [mainResponse, emojisResponse] = await goToEmojis(3);
				bots[1].clickButton("Leave Game", emojisResponse);

				let successResponse;
	
				[mainResponse, emojisResponse, successResponse] = await Promise.all(
					[client.waitForMessageUpdate({ embeds: [{ data: { title: "Connect4 game setting up..." } }] }), 
					 client.waitForMessageUpdate({embeds: [{data: {title: "Set emojis"}}]}),
					 client.waitForMessageCreate({embeds: [{data: {description: "You have left the game."}}]})
					])
	
				expect(
					mainResponse.embeds.at(0).description.includes(`<@${bots[0].userId}> - :crown:`)
				).toBeTruthy();
				expect(
					mainResponse.embeds.at(0).description.includes(`<@${bots[1].userId}> - :crown:`)
				).toBeFalsy();
				expect(
					mainResponse.embeds.at(0).description.includes(`<@${bots[2].userId}>`)
				).toBeTruthy();

				expect(
					emojisResponse.embeds.at(0).description.includes(`<@${bots[0].userId}>`)
				).toBeTruthy();
				expect(
					emojisResponse.embeds.at(0).description.includes(`<@${bots[1].userId}>`)
				).toBeFalsy();
				expect(
					emojisResponse.embeds.at(0).description.includes(`<@${bots[2].userId}>`)
				).toBeTruthy();
			});
		});
	
		describe("Owner Clicks Continue", () => {
			it("deletes message and transitions to game stage", async () => {
				let [mainResponse, emojisResponse] = await goToEmojis(3);
				await bots[0].clickButton("Continue", emojisResponse);

				let emojisDelete, gameResponse;
				[mainResponse, emojisDelete, gameResponse] = await Promise.all([
					client.waitForMessageUpdate({embeds: [{ data: { title: "Connect4 game ongoing!" } }]}),
					client.waitForMessageDelete({embeds: [{ data: { title: "Set emojis" } }]}),
					client.waitForMessageCreate({embeds: [{}]})
				]);

				expect(gameResponse.embeds.at(0).description.includes(`<@${bots[0].userId}>`)).toBeTruthy();
			});
		});
	
		describe("Other Clicks Continue", () => {
			it("shows error for not being owner", async () => {
				let [mainResponse, emojisResponse] = await goToEmojis(2);
				await bots[1].clickButton("Continue", emojisResponse);
	
				response = await client.waitForMessageCreate(true);
	
				expect(response.embeds.at(0).description).toBe(
					"You are not the owner of this lobby!"
				);
			});
		});
	
		describe("Owner Clicks Cancel", () => {
			it("closes lobby, option message deleted", async () => {
				let [mainResponse, emojisResponse] = await goToEmojis(2);
				await bots[0].clickButton("Cancel Game", emojisResponse);
				[mainResponse, emojisResponse] = await Promise.all([
					client.waitForMessageUpdate(
						{ embeds: [{ data: { title: "Connect4 game cancelled" } }] },
						true
					),
					client.waitForMessageDelete({
						embeds: [{ data: { title: "Set emojis" } }],
					}),
				]);
	
				expect(mainResponse.embeds.at(0).description).toBe("Blame the leader");
			});
		});
	
		describe("Other Clicks Cancel", () => {
			it("shows error for not being owner", async () => {
				let [mainResponse, emojisResponse] = await goToEmojis(2);
				bots[1].clickButton("Cancel Game", emojisResponse);
	
				response = await client.waitForMessageCreate(true);
	
				expect(response.embeds.at(0).description).toBe(
					"You are not the owner of this lobby!"
				);
	
				expect(response.embeds.at(0).description).toBe(
					"You are not the owner of this lobby!"
				);
			});
		});
	});
});

describe("Game Stage", () => {

	describe("Game Stage Start", () => {
		it("changes the lobby embed title, sends empty board asking player 1 to play.", async () => {
			let [mainResponse, gameResponse] = await goToGame(2);
			console.log(gameResponse.embeds.at(0).data.description);
            expect(mainResponse.embeds.at(0).data.title).toBe("Connect4 game ongoing!") 
            expect(gameResponse.embeds.at(0).data.description.includes(userBot[0])).toBeTruthy();
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
