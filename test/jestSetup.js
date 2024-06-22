const MatthewClient = require("@client");
const TestClient = require("@testClient");
const config = require("@config");

/**
 * @param {Object} messageFunctions - An object containing message-related functions.
 * @param {Function} messageFunctions.edit - Function to edit a message.
 * @param {Function} messageFunctions.deferReply - Function to defer a reply to a message.
 * @param {Function} messageFunctions.reply - Function to send a reply to a message.
 * @returns {Promise<[MatthewClient, TestClient]>}
 */
async function setupTestEnvironment(messageFunctions) {
  const client = new MatthewClient(config, true);

  client.login();
  await new Promise((resolve, reject) => {
    client.once("error", reject);
    client.once("ready", () => {
      client.off("error", reject);
      resolve();
    });
  });

  let testClient = new TestClient(client, messageFunctions);

  await testClient.createDefaults({
    applicationId: process.env.APPLICATION_ID,
    guildId: process.env.GUILD_ID,
    channelId: process.env.CHANNEL_ID,
    userIds: [process.env.USER_ID, process.env.USER_ID_2],
  });

  return [client, testClient];
}

module.exports = setupTestEnvironment;
