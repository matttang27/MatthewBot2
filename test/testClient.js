const {
  Collection,
  CommandInteraction,
  InteractionType,
  ApplicationCommandType,
  GuildMember,
  TextChannel,
  Client,
  Message,
  MessageType,
  CommandInteractionOptionResolver,
  InteractionResponse,
} = require("discord.js");
const { Generator } = require("snowflake-generator");
const randomString = require("randomized-string");
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
   * @param {Client} client - The original client.
   * @param {Object} messageFunctions - An object containing the functions you would like to replace the
   * original interaction functions with
   * @param {Function} messageFunctions.edit - Function called on response.edit
   * @param {Function} messageFunctions.deferReply - Function called on interaction.deferReply()
   * @param {Function} messageFunctions.reply - Function called on interaction.reply()
   * @param {Function} messageFunctions.editReply - Function called on interaction.editReply()
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
    });
  }

  

  /**
   * Creates a response function.
   * @param {Object} interaction - The interaction object.
   * @param {Function} messageFunction - The function to call (e.g., this.messageFunctions.reply).
   * @param {string} [message] - The message to console.log
   * @returns {InteractionResponse} The created response
   */

  createResponseFunction(newFunction, interaction, message) {
    return (...args) => {
      console.log(message, ...args)
      newFunction(...args);
      let response = new InteractionResponse(interaction);
      response.edit = this.messageFunctions.edit;
      return response;
    }
  }
  
  /**
   * 
   * @param {GuildMember} member
   * @param {string} commandName
   * @param {Object} options
   * @returns {CommandInteraction} the created interaction
   */
  createCommandInteraction(member, commandName, options) {

    const snowflakeGenerator = new Generator(Date.now());

    const interaction = new CommandInteraction(this.client, {
      type: InteractionType.ApplicationCommand,
      id: snowflakeGenerator.generate().toString(),
      application_id: this.applicationId,
      channel: this.channel,
      guild_id: this.guild.id,
      user: member.user,
      member: member,
      version: 1,
      locale: "en-GB",
      token: randomString.generate(50),
      entitlements: new Collection(),
      data: {
        id: "1242987881392242798",
        name: commandName,
        type: ApplicationCommandType.ChatInput,
        guild_id: this.guild.id,
      },
    });

    //interaction.options = new CommandInteractionOptionResolver(this.client, options)
    interaction.reply = this.createResponseFunction(this.messageFunctions.reply, interaction, 'Replied: ');
    interaction.deferReply = this.createResponseFunction(this.messageFunctions.deferReply, interaction, 'Reply deferred');
    interaction.editReply = this.createResponseFunction(this.messageFunctions.editReply, interaction, 'Reply edited');

    return interaction
  }

  /**
   *
   * @param {GuildMember} member
   * @param {string} commandName
   * @param {Object} options
   * @returns {CommandInteraction, Promise<any>} the created interaction
   */

  sendCommand(member, commandName, options) {
    

    let interaction = this.createCommandInteraction(member, commandName, options);

    this.client.emit("interactionCreate", interaction);

    return interaction
  }

  testingMessageSend(member, commandName, options) {
    const snowflakeGenerator = new Generator(Date.now());

    const interaction = new CommandInteraction(this.client, {
      type: InteractionType.ApplicationCommand,
      id: snowflakeGenerator.generate().toString(),
      application_id: this.applicationId,
      channel: this.channel,
      guild_id: this.guild.id,
      user: member.user,
      member: member,
      version: 1,
      locale: "en-GB",
      token: randomString.generate(50),
      entitlements: new Collection(),
      data: {
        id: "1242987881392242798",
        name: commandName,
        type: ApplicationCommandType.ChatInput,
        guild_id: this.guild.id,
      },
    });

    this.client.emit("interactionCreate", interaction);

    return interaction;
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
    });

    this.client.emit("messageCreate", message);
  }

  /**
   *
   * @param {GuildMember} member
   * @param {TextChannel} channel
   * @param {string} content
   */
  async waitForResponse(channel, content) {
    await new Promise((resolve, reject) => {
      client.once("error", reject);
      client.once("messageCreate", (m) => {

        if (m.author.id == this.client.id) {}
        client.off("error", reject);
        resolve();
      });
    });
  }
}

module.exports = TestClient;
