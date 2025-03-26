const { PermissionsBitField } = require('discord.js');
const db = require('../database');

module.exports = {
    name: 'resetwarns',

    async handleResetWarns(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const resetAll = interaction.options.getBoolean('all');

        if (resetAll) {
            db.prepare('DELETE FROM warnings').run();
            return interaction.reply('✅ All warnings have been reset.');
        } else {
            db.prepare('DELETE FROM warnings WHERE user_id = ?').run(user.id);
            return interaction.reply(`✅ All warnings for <@${user.id}> have been reset.`);
        }
    }
};
