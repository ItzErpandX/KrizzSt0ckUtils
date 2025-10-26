const { EmbedBuilder } = require('discord.js');
const { hasStaffPermission } = require('../utils/permissionCheck');
const db = require('../database');

module.exports = {
    name: 'checkrejoin',
    async handleCheckRejoin(interaction) {
        if (!hasStaffPermission(interaction.member)) {
        //if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) { 
            return interaction.reply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const rejoinRecords = db.prepare('SELECT * FROM rejoins WHERE user_id = ?').all(user.id);

        if (!rejoinRecords.length) {
            return interaction.reply({ content: `❌ No rejoin record found for **${user.tag}**.`, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`🔁 Check rejoin for ${user.tag}`)
            .setColor('Orange')
            .setTimestamp();

        const desc = rejoinRecords.map((record) =>
            `First joined at: <t:${Math.floor(new Date(record.first_joined_at).getTime() / 1000)}:f>`
        ).join("\n");

        embed.setDescription(desc.length > 4000 ? desc.slice(0, 4000) + "\n...and more" : desc);

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
