const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const { hasStaffPermission } = require('../utils/permissionCheck');
const db = require('../database');

module.exports = {
    name: 'invitedlist',
    async handleInvitedList(interaction) {
        if (!hasStaffPermission(interaction.member)) {
        //if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        //const invitedUsers = db.prepare('SELECT * FROM invites WHERE inviter_id = ? ORDER BY joined_at ASC').all(user.id);
        const invitedUsers = db.prepare("SELECT * FROM invites WHERE inviter_id = ? AND (left_at IS NULL OR left_at = '') ORDER BY joined_at ASC").all(user.id);


        if (!invitedUsers.length) {
            return interaction.reply({ content: `❌ **${user.tag}** hasn't invited anyone.`, ephemeral: true });
        }

        // Pagination setup
        const invitesPerPage = 10;
        let currentPage = 0;
        const totalPages = Math.ceil(invitedUsers.length / invitesPerPage);

        // Function to generate embed for a page
        const generateEmbed = (page) => {
            const start = page * invitesPerPage;
            const end = start + invitesPerPage;
            const pageInvites = invitedUsers.slice(start, end);

            const list = pageInvites.map((invite, index) =>
                `${start + index + 1}. <@${invite.user_id}> — <t:${Math.floor(new Date(invite.joined_at).getTime() / 1000)}:F>`
            ).join('\n');

            return new EmbedBuilder()
                .setTitle(`📜 Invited List for ${user.tag}`)
                .setDescription(list)
                .setFooter({ text: `Page ${page + 1} of ${totalPages} • Total Invited: ${invitedUsers.length}` })
                .setColor('Blue');
        };

        // Function to generate buttons
        const generateRow = (page) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('prev_invites').setLabel('⬅️ Previous').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
                new ButtonBuilder().setCustomId('next_invites').setLabel('➡️ Next').setStyle(ButtonStyle.Secondary).setDisabled(page === totalPages - 1)
            );
        };

        // Send first embed
        const embed = generateEmbed(currentPage);
        const row = generateRow(currentPage);

        const reply = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        // Pagination collector
        const collector = reply.createMessageComponentCollector({ time: 60_000 });

        collector.on('collect', async (btnInteraction) => {
            if (btnInteraction.user.id !== interaction.user.id) return btnInteraction.reply({ content: "❌ These buttons aren't for you.", ephemeral: true });

            if (btnInteraction.customId === 'prev_invites') currentPage--;
            if (btnInteraction.customId === 'next_invites') currentPage++;

            await btnInteraction.update({ embeds: [generateEmbed(currentPage)], components: [generateRow(currentPage)] });
        });

        collector.on('end', async () => {
            await interaction.editReply({ components: [] });
        });
    }
};
