require('module-alias-jest/register')
const MatthewClient = require('@client');
const config = require('@config/config.json');
const userBots = require('@config/userBots.json');
const client = new MatthewClient(config,true);

const UserBot = require('@userBot');

const {setup, eachSetup} = require('@testSetup');
beforeAll(async () => {
  bots = await setup(client, 1)
}, 100_000);

beforeEach(async () => {
  await eachSetup(client,bots);
});

afterAll(async () => {
  bots.forEach(bot => bot.browser.close())
})

describe('testing command', () => {
  it('should reply with an ephemeral message', async () => {

    await bots[0].sendCommand("testing", "MatthewBot2");

    let response = await client.waitForMessage({"embeds": [{"data": {"description":"ephemeral message"}}]})
    
    expect(response.embeds[0].description).toBe("ephemeral message");


    
  }, 1000_000);
});