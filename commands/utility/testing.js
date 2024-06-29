const { SlashCommandBuilder, EmbedBuilder, CommandInteraction } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('testing')
		.setDescription('Tests whatever'),

    /**
     * 
     * @param {CommandInteraction} interaction 
     */
	async execute(interaction) {
		
		let embed = new EmbedBuilder()
        .setColor('Red')
        .setDescription("ephemeral message")

        
		let response = await interaction.reply({embeds: [embed], ephemeral: true});

        let messages = await interaction.channel.messages.fetch({limit: 5});
        console.log(messages);
	},
};