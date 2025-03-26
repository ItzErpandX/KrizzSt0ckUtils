const db = require('../database');
const { hasStaffPermission } = require('../utils/permissionCheck');

module.exports = {
    name: 'add',
    async handleAdd(interaction) {
        const channel = interaction.channel;
        const member = interaction.options.getMember('member');

        if (!hasStaffPermission(interaction.member)) {
            return interaction.reply({ content: "❌ Only staff or higher can use this command.", ephemeral: true });
        }

        const ticketData = db.prepare("SELECT * FROM tickets WHERE channel_id = ?").get(channel.id);
        if (!ticketData) return interaction.reply({ content: "❌ Not a valid ticket channel.", ephemeral: true });

        db.prepare("INSERT OR IGNORE INTO ticket_members (channel_id, member_id) VALUES (?, ?)").run(channel.id, member.id);
        await channel.permissionOverwrites.edit(member.id, { ViewChannel: true, SendMessages: true });

        return interaction.reply({ content: `✅ **${member.user.tag}** has been added to the ticket!` });
    }
};
