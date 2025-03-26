const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('../database');

module.exports = {
    name: 'leaderboard',
    async handleLeaderboard(interaction) {
        const option = interaction.options.getString('option');
        const validOptions = [
            'tickets_opened',
            'tickets_closed',
            'tickets_claimed',
            'tickets_unclaimed',
            'tickets_force_claimed',
            'tickets_message_sent',
            'tickets_staff_message_sent'
        ];

        if (!validOptions.includes(option)) {
            return interaction.reply({ content: "❌ Invalid option. Please choose a valid one.", ephemeral: true });
        }

        // Assuming you have a `ticket_stats` table where you store all these counts
        const query = `SELECT user_id, ${option} FROM ticket_stats WHERE ${option} > 0 ORDER BY ${option} DESC LIMIT 10;`;
        const leaderboard = db.prepare(query).all();

        if (!leaderboard.length) {
            return interaction.reply({ content: `❌ No data found for **${option}** leaderboard.`, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`🏆 Leaderboard - ${option.replaceAll('_', ' ').toUpperCase()}`)
            .setColor('Gold')
            .setTimestamp();

        const description = leaderboard
            .map((entry, index) => `**${index + 1}.** <@${entry.user_id}> - **${entry[option]}**`)
            .join("\n");

        embed.setDescription(description);

        return interaction.reply({ embeds: [embed] });
    }
};
