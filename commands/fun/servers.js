const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
    .setName(`servers`)
    .setDescription(`FDev Servers irl`),
    permissions: 0,
    execute (interaction) {
        interaction.reply({ content: "https://media.discordapp.net/attachments/763535317360705606/1018834882929119232/fdev.gif" });
    }
}
