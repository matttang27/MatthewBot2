const Game = require('./game.js');

const setupTestEnvironment = require('@root/test/jestSetup')
let client;
let testClient;
beforeAll(async () => {
    [client, testClient] = await setupTestEnvironment();
  })
afterEach(() => {
    jest.clearAllMocks();
});

let interaction;
let game;
describe('Game Class', () => {
    beforeAll(async () => {
        interaction = testClient.createMockInteraction(testClient.members[0],"testgame",[])

        game = new Game(interaction);
    })
    it('should have working properties when created', async () => {

        expect(game.properties.gameName).toBe("game");
        expect(game.properties.gameName).toBe("game");
        expect(game.properties.minPlayers).toBe(2);
        expect(game.properties.maxPlayers).toBe(4);
        expect(game.options[0].name).toBe("example");
        expect(game.options[0].value).toBe(5);
        expect(game.players.size).toBe(1);
        expect(game.players.has(interaction.user.id)).toBe(true);
    });
    it('should update players properly', async () => {
        game.lobby();

        let message = await testClient.waitForMessage(channel,content);
    })
})
