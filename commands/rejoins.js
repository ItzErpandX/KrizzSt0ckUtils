const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { hasStaffPermission } = require('../utils/permissionCheck');
const db = require('../database');

module.exports = {
    name: 'rejoins',
    async handleRejoins(interaction) {
        if (!hasStaffPermission(interaction.member)) {
        //if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
        }

        // Get the user option
        const user = interaction.options.getUser('user');
        if (!user) return interaction.reply({ content: "❌ You must mention a user to check their rejoins.", ephemeral: true });

        // Fetch rejoins for that inviter
        const rejoins = db.prepare('SELECT * FROM rejoins WHERE inviter_id = ?').all(user.id);

        if (!rejoins.length) {
            return interaction.reply({ content: `❌ No rejoins found for **${user.tag}**.`, ephemeral: true });
        }

        // Build embed with results
        const embed = new EmbedBuilder()
            .setTitle(`🔁 Rejoins Invited by ${user.tag}`)
            .setColor('Orange')
            .setTimestamp();

        const description = rejoins
            .sort((a, b) => new Date(b.first_joined_at) - new Date(a.first_joined_at))
            .map((r, index) => `**${index + 1}.** <@${r.user_id}> - First Joined: <t:${Math.floor(new Date(r.first_joined_at).getTime() / 1000)}:f>`)
            .join("\n");

        embed.setDescription(description.length > 4000 ? description.slice(0, 4000) + "\n...and more" : description);

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
