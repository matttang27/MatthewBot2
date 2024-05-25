// pingCommand.test.js

const { SlashCommandBuilder, Client, InteractionResponse } = require('discord.js');

// Mocking the interaction object
const mockInteraction = {
  reply: jest.fn(),
};

// Import the command module
const command = require('./ping.js');

describe('ping command', () => {
  beforeEach(() => {
    let mockClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
      ],
    });

    mockInteraction = {
      reply: jest.fn(),
      channel: {
        send: jest.fn(),
        awaitMessages: jest.fn(),
      },
      user: {
        id: "12345",
      },
    };
  }),
  it('should reply with Pong!', async () => {
    // Execute the command
    await command.execute(mockInteraction);

    // Check if reply was called with 'Pong!'
    expect(mockInteraction.reply).toHaveBeenCalledWith('Pong!');
  });
});