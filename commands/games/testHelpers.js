//This file contains helper functions for testing the game class (and extensions)


/**
 * Goes directly to options screen by having players automatically join the lobby
 * @param {string} gameCommand the command to input
 * @param {UserBot[]} bots the UserBots to use
 * @param {MatthewClient} client the client
 * @param {number} numPlayers the number of players to join lobby
 * @returns {Promise<[InteractionResponse,InteractionResponse]>} returns the main response and options response or an error if a bug occured.
 * 
 */
async function goToOptionsBase(gameCommand, bots, client, numPlayers) {
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
 * @param {UserBot[]} bots the UserBots to use
 * @param {MatthewClient} client the client
 * @returns {function(number): Promise<[InteractionResponse, InteractionResponse] | Error>}
 * 
 * @example
 * const goToOptions = goToOptionsCreator("testgame", bots, client);
 * 
 * //later:
 * let [mainResponse, optionsResponse] = await goToOptions(2);
 */
function goToOptionsCreator(commandName, bots, client) {
	return (numPlayers) => {
		return goToOptionsBase(commandName, bots, client, numPlayers)
	}
}

module.exports = {goToOptionsCreator, goToOptionsBase}