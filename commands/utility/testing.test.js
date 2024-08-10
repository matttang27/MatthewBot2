require('module-alias-jest/register')
const MatthewClient = require('@client');
const client = new MatthewClient();

const {setup, eachSetup} = require('@testSetup');
beforeAll(async () => {
  bots = await setup(client, 1)
}, 100_000);

beforeEach(async () => {
  await eachSetup(client,bots);
});



describe('testing command', () => {
  it('should reply with an ephemeral message', async () => {

    await bots[0].sendCommand("testing");

    let response = await client.waitForMessage({"embeds": [{"data": {"description":"ephemeral message"}}]})
    
    expect(response.embeds[0].description).toBe("ephemeral message");


    
  }, 1000_000);
});