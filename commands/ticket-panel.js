const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const db = require('../database');

module.exports = {
    name: 'ticket-panel',
    async handleTicketPanel(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('🎫 Create a Ticket')
            .setDescription('>>> Feel free to open a ticket for any questions, offers, or to purchase.')
            .setColor(0x00FF00);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('create_ticket').setLabel('Create Ticket').setStyle(ButtonStyle.Primary)
        );

        const message = await interaction.channel.send({ embeds: [embed], components: [row] });

        db.prepare(`INSERT INTO panel (message_id, channel_id) VALUES (?, ?) 
            ON CONFLICT(message_id) DO UPDATE SET channel_id = excluded.channel_id`).run(message.id, interaction.channel.id);

        return interaction.reply({ content: "✅ Ticket panel sent successfully!", ephemeral: true });
    }
};
