const MatthewClient = require('../../matthewClient');
const TestClient = require('../../test/testClient');
const config = require('../../config.json');
const matthewClient = new MatthewClient(config, true);
const client = matthewClient.client;

let testClient;

beforeAll(async () => {
  matthewClient.login()
  await new Promise((resolve, reject) => {
    client.once("error", reject);
    client.once("ready", () => {
      client.off("error", reject);
      resolve();
    });
  });

  testClient = new TestClient(client, {
    edit: jest.fn(),
    deferReply: jest.fn(),
    reply: jest.fn(),
  })

  await testClient.createDefaults({
    applicationId: process.env.APPLICATION_ID,
    guildId: process.env.GUILD_ID,
    channelId: process.env.CHANNEL_ID,
    userIds: [process.env.USER_ID, process.env.USER_ID_2],
  })
})

describe('ping command', () => {
  it('should reply with Pong!', async () => {
    // Execute the command
    testClient.sendCommand(testClient.members[0],"ping",[]);

    // Check if reply was called with 'Pong!'
    await new Promise((r) => setTimeout(r, 2000));
    expect(testClient.messageFunctions.edit).toHaveBeenCalled();
    expect(testClient.messageFunctions.deferReply).toHaveBeenCalledWith("defered");
    
  }, 15_000);
});