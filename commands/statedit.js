const { PermissionsBitField } = require('discord.js');
const db = require('../database');
require('dotenv').config(); 

module.exports = {
    name: 'statedit',

    async handleStatEdit(interaction) {
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ content: '❌ Only the bot owner can use this command.', ephemeral: true });
        }

        const stat = interaction.options.getString('stat');
        const action = interaction.options.getString('option');
        const user = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');

        let userStats = db.prepare('SELECT * FROM ticket_stats WHERE user_id = ?').get(user.id);
        if (!userStats) {
            db.prepare(`INSERT INTO ticket_stats (user_id, ${stat}) VALUES (?, ?)`).run(user.id, action === 'remove' ? 0 : amount);
        } else {
            let newValue = userStats[stat];

            if (action === 'add') {
                newValue += amount;
            } else if (action === 'remove') {
                newValue = Math.max(0, newValue - amount); 
            } else if (action === 'set') {
                newValue = amount;
            }

            db.prepare(`UPDATE ticket_stats SET ${stat} = ? WHERE user_id = ?`).run(newValue, user.id);
        }

        await interaction.reply({
            content: `✅ Successfully **${action}** **${amount}** to **${stat}** for <@${user.id}>.`,
            ephemeral: false
        });
    }
};
