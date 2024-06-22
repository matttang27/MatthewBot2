const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		await new Promise(r => setTimeout(r, 2000));
		
		let response = await interaction.deferReply();
		await response.edit('Pong!');
	},
};