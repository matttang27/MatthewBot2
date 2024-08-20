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

    interaction.reply({content: "Hello", ephemeral: true})

        /*
        let embed1 = new EmbedBuilder()
        .setColor('Red')
        .setDescription("Hello 1")

        let embed2 = new EmbedBuilder()
        .setColor('Green')
        .setDescription("Hello 2")

        let body = {embeds: [embed1]}

        
		let response = await interaction.reply(body);

        await new Promise(r => setTimeout(r,2000))
        await response.edit({embeds: [embed1,embed2]});
        await new Promise(r => setTimeout(r,2000))
        await response.edit({embeds: [embed2]});
        await new Promise(r => setTimeout(r,2000))
        await response.edit({embeds: [embed1,embed2]});*/
	},
};