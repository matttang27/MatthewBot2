const { EmbedBuilder } = require("discord.js")

module.exports = {
    errorEmbed(description) {
        let embed = new EmbedBuilder()
        .setColor('Red')
        .setDescription(description)

        return {embeds: [embed], ephemeral: true}
    },
    successEmbed(description) {
        let embed = new EmbedBuilder()
        .setColor('Green')
        .setDescription(description)

        return {embeds: [embed], ephemeral: true}
    },
    returnEmotes(string) {
        return string.match(/<a?:.+?:\d{18}>|\p{Extended_Pictographic}/gu);
    }
}