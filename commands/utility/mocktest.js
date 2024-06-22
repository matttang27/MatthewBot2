const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType, CommandInteraction, } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mocktest")
    .setDescription("Testing mock interactions")
    .addIntegerOption((option) =>
      option.setName('inttest').setDescription("Integer test")
    )
    .addMentionableOption((option) =>
      option.setName('mentiontest').setDescription("Mention test")
    ),

  /**
   * 
   * @param {CommandInteraction} interaction 
   */
  async execute(interaction) {

    console.log(interaction.options)

    let response = await interaction.deferReply()
    let commandInteraction = interaction;
    let buttonInteraction;
    let chatInteraction;
    
    const test = new ButtonBuilder()
        .setCustomId("test")
        .setLabel("Test")
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(test);

    await interaction.editReply({
        components: [row],
        });
    
    await response.awaitMessageComponent({filter: (i) => true, componentType: ComponentType.Button, time: 120_000})
    .then(interaction => {
        buttonInteraction = interaction
        interaction.deferReply();
    });

    await interaction.channel.send({content: "type pls"})

    await interaction.channel.awaitMessages({filter: (r) => true, max: 1, time: 120_000})
    .then((collected) => {
        chatInteraction = collected.first();
    })

    console.log("done")


    


  },
};
