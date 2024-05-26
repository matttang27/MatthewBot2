const { Events, InteractionType } = require("discord.js");

const TestClient = require("../test/testClient");
const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {

    console.log(`Ready! Logged in as ${client.user.tag}`);

    const waitForReply = (interaction) => {
      return new Promise((resolve, reject) => {
        const originalReply = interaction.reply;
    
        interaction.reply = async function (...args) {
          try {
            const result = await originalReply.apply(this, args);
            resolve(args);
            return result;
          } catch (error) {
            reject(error);
          }
        };
      });
    };

    
    const testClient = new TestClient(client, {
      reply: (i) => (console.log(i))
    });

    await testClient.createDefaults({
      guildId: process.env.GUILD_ID,
      channelId: process.env.CHANNEL_ID,
      userIds: [process.env.USER_ID, process.env.USER_ID_2],
    })

    let reply = await testClient.sendCommand(testClient.members[0],"mocktest");

    console.log("command sent!")
    console.log(reply);
  },
};
