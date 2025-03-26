const db = require('../database');
const { hasStaffPermission } = require('../utils/permissionCheck');
const { generateTranscript } = require('../utils/transcript');
const { incrementUserStat } = require('../helpers/statistics');


module.exports = {
    name: 'close',
    async handleClose(interaction) {
        const channel = interaction.channel;

        if (!hasStaffPermission(interaction.member)) {
            return interaction.reply({ content: "❌ Only staff or higher can close tickets.", ephemeral: true });
        }

        const ticketData = db.prepare("SELECT * FROM tickets WHERE channel_id = ?").get(channel.id);
        if (!ticketData) {
            return interaction.reply({ content: "❌ This ticket is already scheduled for deleting.", ephemeral: true });
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
        db.prepare("DELETE FROM tickets WHERE channel_id = ?").run(channel.id);
        db.prepare("DELETE FROM ticket_members WHERE channel_id = ?").run(channel.id);
        await interaction.followUp({ content: `🔒 Ticket will close in 10 seconds.` });
        setTimeout(() => channel.delete().catch(console.error), 10000);
    }
};
