const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('../database');

module.exports = {
    name: 'stats',

    async handleStats(interaction) {
        const user = interaction.options.getUser('user');
        const stats = db.prepare('SELECT * FROM ticket_stats WHERE user_id = ?').get(user.id);

        if (!stats) {
            return interaction.reply({ content: `❌ No ticket stats found for **${user.tag}**.`, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`📊 Ticket Stats for ${user.tag}`)
            .setColor('Blue')
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setFields(
                { name: "📂 Tickets Opened", value: stats.tickets_opened.toString(), inline: true },
                { name: "✅ Tickets Closed", value: stats.tickets_closed.toString(), inline: true },
                { name: "📌 Tickets Claimed", value: stats.tickets_claimed.toString(), inline: true },
                { name: "🚫 Tickets Unclaimed", value: stats.tickets_unclaimed.toString(), inline: true },
                { name: "⚡ Force Claims", value: stats.tickets_force_claimed.toString(), inline: true },
                { name: "💬 Messages Sent", value: stats.tickets_message_sent.toString(), inline: true },
                { name: "🔧 Staff Messages Sent", value: stats.tickets_staff_message_sent.toString(), inline: true }
            )
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
