const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
    name: 'resetinvites',
    async handleResetInvites(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const resetAll = interaction.options.getBoolean('all');

        if (resetAll) {
            // Reset all invites for everyone
            const total = db.prepare('SELECT COUNT(*) AS total FROM invites').get().total;
            db.prepare('DELETE FROM invites').run();
            db.prepare('UPDATE rejoins SET inviter_id = NULL').run();

            const embed = new EmbedBuilder()
                .setTitle('🔄 All Invites Reset')
                .setDescription(`✅ Successfully reset **${total}** invites from all users.`)
                .setColor('Red')
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        // If specific user provided
        if (!user) {
            return interaction.reply({ content: "❌ Please specify a user to reset invites for, or set 'all' to true.", ephemeral: true });
        }

        const count = db.prepare('SELECT COUNT(*) AS total FROM invites WHERE inviter_id = ?').get(user.id).total;

        db.prepare('DELETE FROM invites WHERE inviter_id = ?').run(user.id);
        db.prepare('UPDATE rejoins SET inviter_id = NULL WHERE inviter_id = ?').run(user.id);

        const embed = new EmbedBuilder()
            .setTitle('🔄 Invites Reset for User')
            .setDescription(`✅ Successfully reset **${count}** invites for **${user.tag}**.`)
            .setColor('Red')
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
