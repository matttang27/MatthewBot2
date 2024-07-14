const { Events } = require('discord.js');

const fs = require('fs');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        console.log(interaction.componentType, interaction.user.id)

        if (interaction.user.id === false || interaction.user.id === true) {
            console.log("NOT WORKING")
        }
        if (!interaction.isChatInputCommand()) return;


       /*let jsonString = JSON.stringify(this, (key, value) =>
        typeof value === 'bigint'
            ? value.toString()
            : value) // return everything else unchanged*/

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