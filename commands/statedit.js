const { SlashCommandBuilder } = require('discord.js');
const db = require('../database');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('statedit')
        .setDescription('Modify a user\'s ticket stats (Bot Owner only).')
        .addSubcommand(subcommand =>
            subcommand
                .setName('modify')
                .setDescription('Modify a specific stat')
                .addStringOption(option =>
                    option.setName('stat')
                        .setDescription('The stat to modify.')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Tickets Opened', value: 'tickets_opened' },
                            { name: 'Tickets Closed', value: 'tickets_closed' },
                            { name: 'Tickets Claimed', value: 'tickets_claimed' },
                            { name: 'Tickets Unclaimed', value: 'tickets_unclaimed' },
                            { name: 'Tickets Force Claimed', value: 'tickets_force_claimed' },
                            { name: 'Tickets Message Sent', value: 'tickets_message_sent' },
                            { name: 'Tickets Staff Message Sent', value: 'tickets_staff_message_sent' }
                        )
                )
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Choose an action.')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Add', value: 'add' },
                            { name: 'Remove', value: 'remove' },
                            { name: 'Set', value: 'set' }
                        )
                )
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user whose stat you want to modify.')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('The value to modify the stat by.')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset all stats for a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user whose stats you want to reset.')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('transfer')
                .setDescription('Transfer all stats from one user to another')
                .addUserOption(option =>
                    option.setName('source')
                        .setDescription('The user to transfer stats FROM.')
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user to transfer stats TO.')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (interaction.user.id !== process.env.OWNER_ID && interaction.user.id !== process.env.OWNER_ID2 && interaction.user.id !== '1328452208970436659') {
            return interaction.reply({ content: '❌ Only the bot owner or <@1328452208970436659> can use this command.', ephemeral: true });
        }

        if (subcommand === 'modify') {
            const stat = interaction.options.getString('stat');
            const action = interaction.options.getString('action');
            const user = interaction.options.getUser('user');
            const amount = interaction.options.getInteger('amount');

            let userStats = db.prepare('SELECT * FROM ticket_stats WHERE user_id = ?').get(user.id);
            if (!userStats) {
                db.prepare(`INSERT INTO ticket_stats (user_id, ${stat}) VALUES (?, ?)`).run(user.id, action === 'remove' ? 0 : amount);
            } else {
                let newValue = userStats[stat] || 0;

                if (action === 'add') {
                    newValue += amount;
                } else if (action === 'remove') {
                    newValue = Math.max(0, newValue - amount);
                } else if (action === 'set') {
                    newValue = amount;
                }

                db.prepare(`UPDATE ticket_stats SET ${stat} = ? WHERE user_id = ?`).run(newValue, user.id);
            }

            const actionVerbs = { add: 'added', remove: 'removed', set: 'set' };
            const actionVerb = actionVerbs[action] || action;

            return interaction.reply({
                content: `✅ Successfully **${actionVerb}** \`${amount}\` **${stat}** for <@${user.id}>.`,
                ephemeral: false
            });

        } else if (subcommand === 'reset') {
            const user = interaction.options.getUser('user');
            db.prepare('UPDATE ticket_stats SET tickets_claimed = 0, tickets_closed = 0, tickets_opened = 0, tickets_unclaimed = 0, tickets_force_claimed = 0, tickets_message_sent = 0, tickets_staff_message_sent = 0 WHERE user_id = ?').run(user.id);
            return interaction.reply({
                content: `✅ Successfully reset all stats for <@${user.id}>.`,
                ephemeral: false
            });

        } else if (subcommand === 'transfer') {
            const source = interaction.options.getUser('source');
            const target = interaction.options.getUser('target');

            const sourceStats = db.prepare('SELECT * FROM ticket_stats WHERE user_id = ?').get(source.id);
            if (!sourceStats) {
                return interaction.reply({ content: `❌ <@${source.id}> doesn't have any stats to transfer.`, ephemeral: true });
            }

            const fields = ['tickets_claimed', 'tickets_closed', 'tickets_opened', 'tickets_unclaimed', 'tickets_force_claimed', 'tickets_message_sent', 'tickets_staff_message_sent'];

            let targetStats = db.prepare('SELECT * FROM ticket_stats WHERE user_id = ?').get(target.id);
            if (!targetStats) {
                db.prepare(`INSERT INTO ticket_stats (user_id, ${fields.join(', ')}) VALUES (?, ${fields.map(() => 0).join(', ')})`).run(target.id);
                targetStats = Object.fromEntries(fields.map(f => [f, 0]));
            }

            const newTargetStats = {};
            for (const field of fields) {
                newTargetStats[field] = (targetStats[field] || 0) + (sourceStats[field] || 0);
            }

            const setClause = fields.map(f => `${f} = ?`).join(', ');
            const setValues = [...fields.map(f => newTargetStats[f]), target.id];
            db.prepare(`UPDATE ticket_stats SET ${setClause} WHERE user_id = ?`).run(...setValues);

            db.prepare(`UPDATE ticket_stats SET ${fields.map(f => `${f} = 0`).join(', ')} WHERE user_id = ?`).run(source.id);

            return interaction.reply({
                content: `✅ Successfully transferred all stats from <@${source.id}> to <@${target.id}> and reset the source user's stats.`,
                ephemeral: false
            });
        }
    }
};
