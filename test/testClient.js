
const {Collection, CommandInteraction,InteractionType , ApplicationCommandType,  GuildMember, TextChannel, Client, Message, MessageType, CommandInteractionOptionResolver, InteractionResponse} = require("discord.js");
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
   * @param {Client} client
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
      this.applicationId = ids.applicationId;
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
  
  async sendCommand(member, commandName, options) {

    const snowflakeGenerator = new Generator(1420070400000); 

    const interaction = new CommandInteraction(this.client, {
      type: InteractionType.ApplicationCommand,
      id: snowflakeGenerator.generate().toString(),
      application_id: this.applicationId,
      channel: this.channel,
      guild_id: this.guild.id,
      user: member.user,
      member: member,
      version: 1,
      locale: 'en-GB',
      token: randomString.generate(50),
      entitlements: new Collection(),
      data: {
        id: "1242987881392242798",
        name: commandName,
        type: ApplicationCommandType.ChatInput,
        guild_id: this.guild.id
      }
    })

    //interaction.options = new CommandInteractionOptionResolver(this.client, options)
    interaction.reply = this.messageFunctions.reply;
    interaction.deferReply = () => {
      console.log("New deferReply");
      let response = new InteractionResponse(interaction);
      response.edit = (m) => {
        console.log(`Edit: ${m}`);
      }
      return response
    }


    const replyPromise = new Promise((resolve) => {
      const originalReply = interaction.reply.bind(interaction);
      interaction.reply = (...args) => {
        console.log("new interaction reply");
        resolve(args);
        return originalReply(...args);
      };
    });

    this.client.emit('interactionCreate', interaction);

    // Wait for interaction.reply to be called and return the parameters used
    return replyPromise;

  }

  /**
   * 
   * @param {GuildMember} member 
   * @param {TextChannel} channel 
   * @param {string} content 
   */

  async sendMessage(member, channel, content) {
    const snowflakeGenerator = new Generator(Date.now());

    const message = new Message(this.client, {
      channel_id: channel.id,
      channel: channel,
      id: snowflakeGenerator.generate().toString(),
      type: MessageType.Default,
      content: content,
      author: member.user,

    })

    this.client.emit('messageCreate', message);

  }
}

module.exports = TestClient;
