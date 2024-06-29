const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('testing')
		.setDescription('Tests whatever'),
	async execute(interaction) {
		
		let embed = new EmbedBuilder()
        .setColor('Red')
        .setDescription("ephemeral message")

        
		let response = await interaction.reply({embeds: [embed], ephemeral: true});
	},
};