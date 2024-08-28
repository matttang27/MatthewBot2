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
            expect(response.embeds.at(1).title).toBe("Choose your piece!");
			expect(response.embeds.at(1).description.includes(`<@${bots[0].userId}> - :blue_circle:`))
			expect(response.embeds.at(1).description.includes(`<@${bots[1].userId}> - :red_circle:`))
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
});

describe("Game Stage", () => {

	it("Plays a game of connect4", async () => {
		let [response, game] = await goToConnect4Game(2);

		for (var i=0;i<3;i++) {
			await bots[0].sendMessage("4");
			response = client.waitForMessageUpdate(true);
			await bots[1].sendMessage("3");
			response = client.waitForMessageUpdate(true);
		}

		await bots[0].sendMessage("4");
		let winScreen;
		[response,winScreen] = await Promise.all([client.waitForMessageUpdate(true), client.waitForMessageCreate(true)]);
		
	})
	describe("Game Stage Start", () => {
		it("changes the lobby embed title, sends empty board asking player 1 to play.", async () => {
			let [response, game] = await goToConnect4Game(2);
			console.log(response.embeds.at(1).data.description);
            expect(response.embeds.at(0).title).toBe("Connect4 game ongoing!")
			//whiteCircleCount = split.length - 1
			expect(response.embeds.at(1).description.split("⚪").length).toBe(43);
            expect(response.embeds.at(1).description.includes(bots[0].userId)).toBeTruthy();
			expect(game.currentOptions.width).toBe(7);
			expect(game.currentOptions.height).toBe(6);
			expect(game.currentOptions.winLength).toBe(4);
			expect(game.currentOptions.timeLimit).toBe(30);
		});
	});
	//gamemodes work

	describe("Options work", () => {
		it("changes the board size if width / height changed", async () => {
			let [response, game] = await goToConnect4Game(2,{width: 5, height: 8});
			expect(game.currentOptions.width).toBe(5);
			expect(game.currentOptions.height).toBe(8);
			expect(response.embeds.at(1).description.split("⚪").length).toBe(41);
		})
		it("changes the win length if winLength changed", async () => {
			let [response, game] = await goToConnect4Game(2, {winLength: 3});
			game.board[5][0] = game.board[5][1] = game.players.at(0).user.id;
			
			await bots[0].sendMessage("3");
			let winScreen;
			[response,winScreen] = await Promise.all([client.waitForMessageUpdate(true), client.waitForMessageCreate(true)]);
		})
		it("changes the time to move if timeLimit changed", async () => {
			let [response, game] = await goToConnect4Game(2, {timeLimit: 10});

			let winScreen;
			[response,winScreen] = await Promise.all([client.waitForMessageUpdate(true,undefined,15000), client.waitForMessageCreate(true,undefined,15000)]);
		})
	})


	describe("Current plays", () => {

		it("deletes the move, sends a new message, and proceeds to the next turn if no win is detected", async () => {
			let [response, game] = await goToConnect4Game(2);
			await bots[0].sendMessage("1")
			let deletedMove;
			[response, deletedMove] = await Promise.all(client.waitForMessageUpdate(true),client.waitForMessageDelete({author: {id: bots[0].userId}}));
		});

		it("deletes the move, declares the player as the winner, and transitions to the end stage if a win is detected", async () => {
			let [response, game] = await goToConnect4Game(2);
			game.board[5][0] = game.board[5][1] = game.board[5][2] = bots[0].userId;

			await bots[0].sendMessage("4")
			let deletedMove, winScreen;
			[response, deletedMove, winScreen] = await Promise.all(
				client.waitForMessageUpdate(true),
				client.waitForMessageDelete({author: {id: bots[0].userId}}),
				client.waitForMessageCreate(true)
			);
		});

		it("does not respond if the column is full.", async () => {
			let [response, game] = await goToConnect4Game(2);
			for (var i=0;i<6;i++) {
				game.board[i][4] = bots[i % 2].userId;
			}
			
			try {
				await bots[0].sendMessage("4")
				let response = await client.waitForMessageUpdate(true);
				return new Error("Message update when not supposed to")
			} catch {};


		});

		it("deletes the move, declares a draw, and transitions to the end stage if the board is full", async () => {
			let [response, game] = await goToConnect4Game(2,{width:2,height:2});
			game.board[0][0] = game.board[1][0] = game.board[1][1] = bots[0].userId;

			await bots[0].sendMessage("2")
			let deletedMove, winScreen;
			[response, deletedMove, winScreen] = await Promise.all(
				client.waitForMessageUpdate(true),
				client.waitForMessageDelete({author: {id: bots[0].userId}}),
				client.waitForMessageCreate(true)
			);
		});


	});

	describe("Current times out", () => {
		it("removes the player from the game, turns their pieces black, and proceeds to the next turn if at least 3 players remain", async () => {
			let [response,game] = await goToConnect4Game(3);
			game.board[0][0] = bots[0].userId;

			await new Promise(r => setTimeout(r,25000));
			response = await client.waitForMessageUpdate(true,undefined,10000);

			expect(response.embeds.at(0).description.includes(`~~<@${bots[1].userId}>~~`)).toBeTruthy()
			expect(response.embeds.at(1).description.split("⚫").length).toBe(2);
			expect(respones.embeds.at(1).description.includes(bots[1].userId)).toBeTruthy();
			
			

		});

		it("declares the remaining player as the winner and transitions to the end stage if only 2 players are left", async () => {
			let [response,game] = await goToConnect4Game(2, {timeLimit: 5000});
			game.board[0][0] = bots[0].userId;

			await new Promise(r => setTimeout(r,3000));
			response, winScreen = await Promise.all(client.waitForMessageUpdate(true), client.waitForMessageCreate(true));

			expect(response.embeds.at(0).description.includes(`<@${bots[1].userId}> has won!`)).toBeTruthy()
			expect(winScreen.embeds.at(0).title).toBe("We have a winner!");
			expect(winScreen.embeds.at(0).description).toBe(`All hail <@${bots[1].userId}>`)
		});
	});
});
