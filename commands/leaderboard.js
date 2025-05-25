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
            'tickets_staff_message_sent',
            'messages_sent'
        ];

        if (!validOptions.includes(option)) {
            return interaction.reply({ content: "❌ Invalid option. Please choose a valid one.", ephemeral: true });
        }

        if (option === 'messages_sent') {
            const query = `SELECT user_id, message_count FROM user_messages WHERE message_count > 0 ORDER BY message_count DESC LIMIT 10;`;
            const leaderboard = db.prepare(query).all();

            if (!leaderboard.length) {
                return interaction.reply({ content: "❌ No data found for **messages** leaderboard.", ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle("🏆 Leaderboard - MESSAGES SENT")
                .setColor('Gold')
                .setTimestamp();

            const description = leaderboard
                .map((entry, index) => `**${index + 1}.** <@${entry.user_id}> - **${entry.message_count}**`)
                .join("\n");

            embed.setDescription(description);

            return interaction.reply({ embeds: [embed] });
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
