const db = require('../database');
const { hasStaffPermission } = require('../utils/permissionCheck');
const { generateTranscript } = require('../utils/transcript');
const { incrementUserStat } = require('../helpers/statistics');
require('dotenv').config();

module.exports = {
    name: 'close',
    async handleClose(interaction) {
        const channel = interaction.channel;

        if (!hasStaffPermission(interaction.member)) {
            return interaction.reply({ content: "❌ Only staff or higher can close tickets.", ephemeral: true });
        }

        let ticketData;
        try {
            ticketData = db.prepare("SELECT * FROM tickets WHERE channel_id = ?").get(channel.id);
        } catch (err) {
            console.error("Database error:", err);
        }

        const isValidTicketChannel = ticketData || (channel.parentId === process.env.CATEGORY_ID);

        if (!isValidTicketChannel) {
            return interaction.reply({
                content: "❌ This channel is not recognized as a valid ticket.",
                ephemeral: true
            });
        }

        if (ticketData) {
            db.prepare("DELETE FROM tickets WHERE channel_id = ?").run(channel.id);
            db.prepare("DELETE FROM ticket_members WHERE channel_id = ?").run(channel.id);
        }

        await interaction.reply({ content: "📜 Saving transcript, please wait..." });

        try {
            await generateTranscript(channel, interaction.member);
        } catch (error) {
            console.error("❌ Error saving transcript:", error);
            return interaction.followUp({ content: "❌ Failed to save transcript.", ephemeral: true });
        }

        const userId = interaction.user.id;
        incrementUserStat(userId, 'tickets_closed');

        await interaction.followUp({ content: `🔒 Ticket will close in 10 seconds.` });

        setTimeout(() => channel.delete().catch(console.error), 10000);
    }
};
