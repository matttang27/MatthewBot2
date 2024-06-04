const setupTestEnvironment = require('../../test/jestSetup')
let client;
let testClient;

beforeAll(async () => {
  [client, testClient] = await setupTestEnvironment();
})

describe('ping command', () => {
  it('should reply with Pong!', async () => {
    // Execute the command
    testClient.sendCommand(testClient.members[0],"ping",[]);

    // Check if reply was called with 'Pong!'
    await new Promise((r) => setTimeout(r, 2000));
    expect(testClient.messageFunctions.edit).toHaveBeenCalledWith("Pong!");
    expect(testClient.messageFunctions.deferReply).toHaveBeenCalled();
    
  }, 15_000);
});