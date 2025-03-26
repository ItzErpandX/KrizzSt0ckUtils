const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { hasStaffPermission } = require('../utils/permissionCheck');
const db = require('../database');

module.exports = {
    name: 'info',
    async handleInfo(interaction) {
        if (!hasStaffPermission(interaction.member)) {
        //if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        const invites = db.prepare('SELECT * FROM invites WHERE inviter_id = ?').all(user.id);
        const invitedBy = db.prepare('SELECT * FROM invites WHERE user_id = ?').get(user.id);
        const rejoins = db.prepare('SELECT COUNT(*) as total FROM rejoins WHERE user_id = ?').get(user.id);
        //const inviteCodes = db.prepare('SELECT code FROM invite_codes WHERE inviter_id = ?').all(user.id); // If you store codes

        const embed = new EmbedBuilder()
            .setTitle(`ℹ️ Info on ${user.tag}`)
            .setColor('Blue')
            .setTimestamp()
            .addFields(
                { name: "🆔 User ID", value: user.id, inline: true },
                { name: "🤖 Is Bot", value: user.bot ? 'Yes' : 'No', inline: true },
                { name: "📅 Account Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:f>`, inline: true }
            );

        if (member) {
            embed.addFields(
                { name: "📆 Joined Server", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:f>`, inline: true }
            );
        }

        embed.addFields(
            { name: "📨 Invited By", value: invitedBy?.inviter_id ? `<@${invitedBy.inviter_id}>` : 'Unknown', inline: true },
            { name: "📥 Number of Invites", value: invites.length.toString(), inline: true },
            { name: "🔁 Rejoins Count", value: rejoins.total.toString(), inline: true },
            //{ name: "💻 Invite Codes", value: inviteCodes.length ? inviteCodes.map(c => `\`${c.code}\``).join(', ') : 'None' }
        );

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
