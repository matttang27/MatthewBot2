
const {Collection, CommandInteraction,InteractionType , ApplicationCommandType,  GuildMember, ...Discord} = require("discord.js");
const {Generator} = require('snowflake-generator');
const randomString = require('randomized-string');
//stores frequently used variables
class TestClient {
  client;
  guild;
  channel;
  users;
  members;
  applicationId;

  commandInteraction;
  buttonInteraction;
  messageInteraction;
  messageFunctions;

  /**
   *
   * @param {Discord.Client} client
   */

  constructor(client, messageFunctions) {
    this.client = client;

    
    this.messageFunctions = messageFunctions;
  }

  /**
   * Sets all the default values of the test client
   * @param {Object} ids
   * @param {number} ids.guildId - The ID of the guild to fetch.
   * @param {number} ids.channelId - The ID of the channel to fetch.
   * @param {number[]} ids.userIds - An array of user IDs. (Must all be in the guild)
   * @param {number} ids.applicationId - The ID of the application.
  */
  createDefaults(ids) {
    return new Promise(async (resolve, reject) => {
      this.guild = await this.client.guilds.fetch(ids.guildId);
      this.channel = await this.guild.channels.fetch(ids.channelId);

      let users = ids.userIds.map(async (user) => {
        return await this.client.users.fetch(user);
      });

      this.users = await Promise.all(users);

      let members = ids.userIds.map(async (user) => {
        return await this.guild.members.fetch(user);
      });

      this.members = await Promise.all(members);

      console.log("finished creating defaults");

      resolve();
    })
    
  }

  /**
   * 
   * @param {GuildMember} member 
   * @param {string} commandName 
   * @returns {Promise<any>} the created interaction 
   */
  
  async sendCommand(member, commandName) {

    const snowflakeGenerator = new Generator(Date.now()); 

    const interaction = new CommandInteraction(this.client, {
      type: InteractionType.ApplicationCommand,
      id: snowflakeGenerator.generate().toString(),
      applicationId: this.applicationId,
      channelId: this.channel.id,
      guildId: this.guild.id,
      user: member.user,
      member: member,
      version: 1,
      locale: 'en-GB',
      token: randomString.generate(50),
      entitlements: new Collection(),
      data: {
        id: "1234",
        name: commandName,
        type: ApplicationCommandType.ChatInput
      }
    })

    interaction.reply = this.messageFunctions.reply;

    const replyPromise = new Promise((resolve) => {
      const originalReply = interaction.reply.bind(interaction);
      interaction.reply = (...args) => {
        resolve(args);
        return originalReply(...args);
      };
    });

    this.client.emit('interactionCreate', interaction);

    // Wait for interaction.reply to be called and return the parameters used
    return replyPromise;

  }
}

module.exports = TestClient;
