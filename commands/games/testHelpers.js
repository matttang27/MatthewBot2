//This file contains helper functions for testing the game class (and extensions)


/**
 * Goes directly to options screen by having players automatically join the lobby, and sets any options
 * @param {string} gameCommand the command to input
 * @param {UserBot[]} bots the UserBots to use
 * @param {MatthewClient} client the client
 * @param {number} numPlayers the number of players to join lobby
 * @param {Object} options the options to set. Input label & value: Ex. {"Example setting": 10}
 * @returns {Promise<[Message,Message]>} returns the main response and options response or an error if a bug occured.
 * 
 * @example sets 
 * let [mainResponse, optionsResponse] = await goToOptionsBase("testgame", bots, client, 3, {"Example setting": 10});
 */
async function goToOptionsBase(gameCommand, bots, client, numPlayers, options={}) {
	try {
		await bots[0].sendCommand(gameCommand);
		let response = await client.waitForMessageCreate(true);

		for (var i = 1; i < numPlayers; i++) {
			await bots[i].clickButton("Join / Leave", response);

			response = await client.waitForMessageUpdate(true);
		}

		await bots[0].clickButton("Start", response);

		let [mainResponse, optionResponse] = await Promise.all([
			client.waitForMessageUpdate({ id: response.id }),
			client.waitForMessageUpdate({
				embeds: [{ data: { title: "Options" } }],
			}),
		]);


		return [mainResponse, optionResponse];
	} catch (err) {
		console.error(err);
		return [new Error("Options Stage failed"), "bleh"];
	}
}

/**
 * Returns a goToOptionsBase function that has everything but the number of players already set.
 * @param {string} commandName 
 * @param {UserBot[]} bots the array of UserBots to use
 * @param {MatthewClient} client the client
 * @returns {function(number, Object=): Promise<[Message, Message] | Error>}
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

module.exports = {goToOptionsCreator, goToOptionsBase}