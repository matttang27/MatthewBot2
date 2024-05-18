// pingCommand.test.js

const { SlashCommandBuilder } = require('discord.js');

// Mocking the interaction object
const mockInteraction = {
  reply: jest.fn(),
};

// Import the command module
const command = require('./ping.js');

describe('ping command', () => {
  it('should reply with Pong!', async () => {
    // Execute the command
    await command.execute(mockInteraction);

    // Check if reply was called with 'Pong!'
    expect(mockInteraction.reply).toHaveBeenCalledWith('Pong!');
  });
});