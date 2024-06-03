const { Events, InteractionType } = require("discord.js");

const TestClient = require("../test/testClient");
const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {

    console.log(`Ready! Logged in as ${client.user.tag}`);
    

    let TESTING = true;
    if (TESTING) {
      const testClient = new TestClient(client, {
        reply: (i) => (console.log(i))
      });
  
      await testClient.createDefaults({
        applicationId: process.env.APPLICATION_ID,
        guildId: process.env.GUILD_ID,
        channelId: process.env.CHANNEL_ID,
        userIds: [process.env.USER_ID, process.env.USER_ID_2],
      })
  
      let reply = await testClient.sendCommand(testClient.members[0],"ping",[]);
  
      
      console.log("command sent!")
      console.log(reply);
  
      //testClient.sendMessage(testClient.members[0],testClient.channel,"send message test")
    }
    
    
  },
};
