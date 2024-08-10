const { Events, ComponentType, BaseInteraction } = require('discord.js');

const fs = require('fs');

module.exports = {
    name: Events.InteractionCreate,
    /**
     * 
     * @param {BaseInteraction} interaction 
     * @returns 
     */
    async execute(interaction) {
        if (interaction.isButton()) {
            console.log(interaction.component.label, interaction.message.id, interaction.user.username)
        };
        
        if (!interaction.isChatInputCommand()) return;

        console.log(interaction.commandName, interaction.user.username)

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    }
}