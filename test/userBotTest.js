require("module-alias-jest/register");
const MatthewClient = require("@client");
const { l } = require("@root/emojiCharacters");
const client = new MatthewClient();
const UserBot = require("@userBot");
const { setup, eachSetup } = require("@testSetup");
const BOT_COUNT = 3;
const {goToLobbyCreator, goToOptionsCreator} = require("@testHelpers");

let goToOptions;
const GAME_COMMAND = "connect4";

(async () => {
    let bots = await setup(client, BOT_COUNT);
    await eachSetup(client, bots);

    goToLobby = goToLobbyCreator(GAME_COMMAND, bots, client);

    goToOptions = goToOptionsCreator(GAME_COMMAND, bots, client);

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
    let [response,game] = await goToConnect4Emojis(3);
    await bots[1].addReaction("aplusrank", response);
    
})();
