//This file contains helper functions for testing the game class (and extensions)

const MatthewClient = require("@root/matthewClient");
const UserBot = require("@root/test/userBot");
const { Message, ButtonInteraction } = require("discord.js");
const Game = require("./game");

/**
 * Makes bots[0] input the command. The response and the created game object is returned.
 * @param {string} gameCommand the command to input
 * @param {UserBot[]} bots the UserBots to use
 * @param {MatthewClient} client the client
 * @returns {Promise<[Message, Game]>} the message response and the created game.
 */
async function goToLobbyBase(gameCommand, bots, client) {
	try {
		await bots[0].sendCommand(gameCommand);
		let response = await client.waitForMessageUpdate(true);

		let game = client.games.find((game) => game.mainResponse.id === response.id);
		if (game == undefined) {throw new Error("Game was not found.")}
		
		return [response,game];
	} catch (err) {
		console.error(err);
		return [err, "bleh"];
	}
}

/**
 * Returns a goToLobbyBase function that has everything set.
 * @param {string} commandName 
 * @param {UserBot[]} bots the array of UserBots to use
 * @param {MatthewClient} client the client
 * @returns {function(): Promise<[Message, Game]>}
 */
function goToLobbyCreator(commandName, bots, client) {
	return () => goToLobbyBase(commandName, bots, client);
}

/**
 * Goes directly to options screen by having players automatically join the lobby, and sets any options
 * @param {string} gameCommand the command to input
 * @param {UserBot[]} bots the UserBots to use
 * @param {MatthewClient} client the client
 * @param {number} numPlayers the number of players to join lobby
 * //TODO: fix this documentation
 * @param {{string: any}} options the options to set. Input label & value: Ex. {"Example setting": 10}
 * @returns {Promise<[Message,Game]>} returns the main response and options response or an error if a bug occured.
 * 
 * @example sets 
 * let [mainResponse, optionsResponse] = await goToOptionsBase("testgame", bots, client, 3, {"Example setting": 10});
 */
async function goToOptionsBase(gameCommand, bots, client, numPlayers, options={}) {
	try {
		let [response,game] = await goToLobbyBase(gameCommand,bots,client);

		for (var i = 1; i < numPlayers; i++) {
			let user = await client.users.fetch(bots[i].userId)
			game.playerAddAction({user: user})
		}
		await bots[0].clickButton("Setup", response);

		response = await client.waitForMessageUpdate({id: response.id});

		for (optionName in options) {
			if (game.options.find(option => option.name == optionName) === undefined) {
				throw Error(`${optionName} is not a valid option`)
			} else {
				game.currentOptions[optionName] = options[optionName];
			}
		}

		game.showOptionsList(true);
		response = await client.waitForMessageUpdate({id: response.id});

		return [response, game];

	} catch (err) {
		console.error(err);
		return [err, "bleh"];
	}
}

/**
 * Returns a goToOptionsBase function that has everything but the number of players already set.
 * @param {string} commandName 
 * @param {UserBot[]} bots the array of UserBots to use
 * @param {MatthewClient} client the client
 * @returns {function(number, Object=): Promise<[Message, Game] | Error>}
 * 
 * @example
 * const goToOptions = goToOptionsCreator("testgame", bots, client);
 * 
 * //later:
 * let [mainResponse, optionsResponse] = await goToOptions(2);
 */
function goToOptionsCreator(commandName, bots, client) {
	return (numPlayers, options={}) => {
		return goToOptionsBase(commandName, bots, client, numPlayers, options)
	}
}

module.exports = { goToLobbyCreator, goToLobbyBase, goToOptionsCreator, goToOptionsBase}