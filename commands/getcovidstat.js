const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("getcovidstat")
        .setDescription("get current covid stat in Thailand"),
    async execute(interaction) {
        await interaction.channel.send("Pong!");
    },
};
