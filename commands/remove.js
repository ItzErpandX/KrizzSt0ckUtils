const db = require('../database');
const { hasStaffPermission } = require('../utils/permissionCheck');

module.exports = {
    name: 'remove',
    async handleRemove(interaction) {
        const channel = interaction.channel;
        const member = interaction.options.getMember('member');

        if (!hasStaffPermission(interaction.member)) {
            return interaction.reply({ content: "❌ Only staff or higher can use this command.", ephemeral: true });
        }

        const ticketData = db.prepare("SELECT * FROM tickets WHERE channel_id = ?").get(channel.id);
        if (!ticketData) return interaction.reply({ content: "❌ Not a valid ticket channel.", ephemeral: true });

        db.prepare("DELETE FROM ticket_members WHERE channel_id = ? AND member_id = ?").run(channel.id, member.id);
        await channel.permissionOverwrites.delete(member.id);

        return interaction.reply({ content: `✅ **${member.user.tag}** has been removed from the ticket!` });
    }
};
