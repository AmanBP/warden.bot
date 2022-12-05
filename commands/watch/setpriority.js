const { SlashCommandBuilder } = require('@discordjs/builders');
const db = require("../../db/index");

module.exports = {
    data: new SlashCommandBuilder()
	.setName('setpriority')
	.setDescription('Update the priority of a system in Sentry Database')
    .addStringOption(option => option.setName('system-name')
		.setDescription('Name of the System')
		.setRequired(true))
    .addStringOption(option => option.setName('priority')
		.setDescription('Set the priority level')
		.setRequired(true)
        .addChoice('#1', '1')
        .addChoice('#2', '2')
        .addChoice('#3', '3')
        .addChoice('None', '0')),
	permissions: 2,
	async execute(interaction) {
        await interaction.deferReply();
		try {
            let systemName = interaction.options.data.find(arg => arg.name === 'system-name').value
            let priorityLevel = interaction.options.data.find(arg => arg.name === 'priority').value;

            let res = await db.query(`SELECT * FROM systems`)
            let data = res.rows

            let system = data.find(element => element.name === systemName)

            if (!system) {
                return interaction.editReply({ content: `Sorry, "**${systemName}**" could not be found in the database, it may not have been detected by sentry yet. Please visit the system with EDMC running.`})
            } 

            if (system.priority == priorityLevel) {
                return interaction.editReply({ content: `**${systemName}** is already set to **${priorityLevel}**.`})
            }

            await db.query(`UPDATE systems SET priority = null WHERE priority = $1`, [priorityLevel])
            await db.query(`UPDATE systems SET priority = $1 WHERE name = $2`, [priorityLevel, systemName])
            interaction.editReply({ content: `✅ **${systemName}** updated to Priority **#${priorityLevel}**`})

		} catch (err) {
            console.log(err)
			interaction.channel.send({ content: "Something went wrong, please ensure you have entered the correct format." })
		}        
	},
};
