

require("module-alias-jest/register");
const Game = require('./game.js');
/** @type {Connect4Game}*/
let currentGame;


describe('Game Class', () => {
    beforeAll(async () => {
        interaction = {user: {id: 1}}

        currentGame = new Game(interaction);
    })
    it('should have working properties when created', async () => {

        expect(currentGame.properties.gameName).toBe("game");
        expect(currentGame.properties.gameName).toBe("game");
        expect(currentGame.properties.minPlayers).toBe(2);
        expect(currentGame.properties.maxPlayers).toBe(4);
        expect(currentGame.options[0].name).toBe("example");
        expect(currentGame.options[0].value).toBe(5);
        expect(currentGame.players.size).toBe(1);
        expect(currentGame.players.has(interaction.user.id)).toBe(true);
    });
})
