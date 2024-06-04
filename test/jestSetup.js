const MatthewClient = require("../matthewClient");
const TestClient = require("../test/testClient");
const config = require("../config.json");

async function setupTestEnvironment() {
  const client = new MatthewClient(config, true);

  client.login();
  await new Promise((resolve, reject) => {
    client.once("error", reject);
    client.once("ready", () => {
      client.off("error", reject);
      resolve();
    });
  });

  let testClient = new TestClient(client, {
    edit: jest.fn(),
    deferReply: jest.fn(),
    reply: jest.fn(),
  });

  await testClient.createDefaults({
    applicationId: process.env.APPLICATION_ID,
    guildId: process.env.GUILD_ID,
    channelId: process.env.CHANNEL_ID,
    userIds: [process.env.USER_ID, process.env.USER_ID_2],
  });

  return [client, testClient]
}

module.exports = setupTestEnvironment;