const {
    SlashCommandBuilder,
    EmbedBuilder,
    CommandInteraction,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unittesting")
        .setDescription(
            "Tests every type of MatthewClient / UserBot unit tests"
        ),

    /**
     *
     * @param {CommandInteraction} interaction
     */
    async execute(interaction) {
        //tests:
        //MessageCreate and whether it can recognize different embed content
        //MessageUpdate and whether it can recognize different content
        //MessageDelete and whether it can recognize different message ids

        try {
            await interaction.reply("STARTING UNIT TEST");

            const buttonFilter = b =>  {
                try {
                    b.deferUpdate();
                }
                catch (err) {
                    console.log(err)
                }
                
                return b.user.id === interaction.user.id
            }
            //MessageCreate embed content:
            let incorrectResponse = await interaction.channel.send({
                embeds: [new EmbedBuilder().setTitle("Do not press button")],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel("Button")
                            .setCustomId("incorrect")
                            .setStyle(ButtonStyle.Danger)
                    ),
                ],
            });
            let correctResponse = await interaction.channel.send({
                embeds: [new EmbedBuilder().setTitle("Press button")],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel("Button")
                            .setCustomId("correct")
                            .setStyle(ButtonStyle.Primary)
                    ),
                ],
            });

            let check = await Promise.all([
                incorrectResponse
                    .awaitMessageComponent({componentType: ComponentType.Button, filter: buttonFilter, time: 5_000 })
                    .then((b) => {
                        throw new Error("failed");
                    })
                    .catch((err) => {return null}),
                correctResponse
                    .awaitMessageComponent({componentType: ComponentType.Button, filter: buttonFilter, time: 5_000 })
                    .then((b) => {})
                    .catch((err) => {
                        throw new Error("failed");
                    })
            ]);

            //MessageUpdate content:

            incorrectResponse = await incorrectResponse.edit({
                content: "Do not press button",
                embeds: [],
                /*components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel("Button")
                            .setCustomId("incorrect")
                            .setStyle(ButtonStyle.Danger)
                    ),
                ],*/
            });
            correctResponse = await correctResponse.edit({
                content: "Press button",
                embeds: [],
                /*components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel("Button")
                            .setCustomId("correct")
                            .setStyle(ButtonStyle.Primary)
                    ),
                ],*/
            });

            check = await Promise.all([
                incorrectResponse
                    .awaitMessageComponent({componentType: ComponentType.Button, filter: buttonFilter, time: 5_000 })
                    .then((b) => {
                        throw new Error("failed");
                    })
                    .catch((err) => {return null}),
                correctResponse
                    .awaitMessageComponent({componentType: ComponentType.Button, filter: buttonFilter, time: 5_000 })
                    .then((b) => {})
                    .catch((err) => {
                        throw new Error("failed");
                    })
            ]);

            //MessageDelete message id:

            let deleteResponse = await interaction.channel.send({
                content:
                    "Both previous messages will be deleted. On delete, press the button that has the correctResponse id.",
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel(`${correctResponse.id}`)
                            .setCustomId("correct")
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setLabel(`${incorrectResponse.id}`)
                            .setCustomId("incorrect")
                            .setStyle(ButtonStyle.Danger)
                    ),
                ],
            });

            let deleted = false;

            let result = deleteResponse
                .awaitMessageComponent({componentType: ComponentType.Button, filter: buttonFilter, time: 10_000 })
                .then((b) => {
                    if (b.customId == "correct" && deleted) {
                        return;
                    } else if (! deleted) {
                        throw new Error("Too early");
                    } else {
                        throw new Error("Wrong button");
                    }
                })
                .catch((err) => {
                    throw new Error("No response");
                });

            

            await incorrectResponse.delete();
            await correctResponse.delete();

            deleted = true;

            await result;


            await interaction.channel.send("Passed!");
        } catch (err) {
            await interaction.channel.send("Failed");
            console.error(err);
        }
    },
};
