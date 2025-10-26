const { EmbedBuilder } = require('discord.js');
const db = require('../database');
const { REJOIN_LOG_CHANNEL } = require('../config');
const { INVITE_LOG_CHANNEL } = require('../config');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        const client = member.client;
        const logChannel = member.guild.channels.cache.get(REJOIN_LOG_CHANNEL);
        const invitelogChannel = member.guild.channels.cache.get(INVITE_LOG_CHANNEL);

        // Fetch invites BEFORE join
        const beforeInvites = client.invitations[member.guild.id] || {};

        // Fetch invites AFTER join
        const afterInvitesRaw = await member.guild.invites.fetch().catch(() => null);
        if (!afterInvitesRaw) return console.error(`❌ Couldn't fetch invites for ${member.guild.name}`);
        const afterInvites = {};
        afterInvitesRaw.forEach(inv => {
            afterInvites[inv.code] = {
                code: inv.code,
                inviter: inv.inviter?.id || null,
                uses: inv.uses
            };
        });
        client.invitations[member.guild.id] = afterInvites;

        // Find used invite
        let usedInvite = null;
        for (const code in afterInvites) {
            const after = afterInvites[code];
            const before = beforeInvites[code];
            if (before && after.uses > before.uses) {
                usedInvite = after;
                break;
            }
        }

        if (!usedInvite) {
            for (const code in afterInvites) {
                const newInvite = afterInvites[code];
                if (!beforeInvites[code] && newInvite.uses === 1) {
                    usedInvite = newInvite;
                    break;
                }
            }
        }

        let inviter = usedInvite?.inviter || null;
        let joinType = inviter ? 'normal' : 'unknown';

        if (!inviter) {
            const vanity = await member.guild.fetchVanityData().catch(() => null);
            if (vanity && vanity.uses > 0) {
                joinType = 'vanity';
            } else if (member.user.bot) {
                joinType = 'oauth';
            }
        }

        const rejoinData = db.prepare('SELECT * FROM rejoins WHERE user_id = ?').get(member.id);
        if (rejoinData) {
            //db.prepare('UPDATE rejoins SET inviter_id = ? WHERE user_id = ?').run(inviter, member.id);
            db.prepare('UPDATE rejoins SET inviter_id = ? WHERE user_id = ?').run(inviter ? inviter : null, member.id);
            console.log(`[REJOIN] ${member.user.tag} rejoined.`);
            const embed = new EmbedBuilder()
                .setTitle('🔁 Rejoin Detected')
                .setColor('Orange')
                .setDescription(`**${member.user.tag}** (${member.id}) has rejoined the server.`)
                .addFields(
                    { name: 'First Joined At', value: `<t:${Math.floor(new Date(rejoinData.first_joined_at).getTime() / 1000)}:f>`, inline: true },
                    { name: 'Invited By (Now)', value: inviter ? `<@${inviter}>` : 'Unknown', inline: true }
                )
                .setTimestamp();

            await logChannel?.send({ embeds: [embed] });
        } else {
            db.prepare('INSERT OR IGNORE INTO invites (user_id, inviter_id, joined_at) VALUES (?, ?, ?)').run(
                member.id, inviter, new Date().toISOString()
            );
        }

        const embed = new EmbedBuilder()
            .setTitle(joinType === 'normal' ? '📨 User Joined via Invite' :
                      joinType === 'vanity' ? '🌐 User Joined via Vanity URL' :
                      joinType === 'oauth' ? '🤖 Bot Joined' : '❓ Unknown Join Method')
            .setDescription(`**${member.user.tag}** (${member.id}) joined.`)
            .setColor(joinType === 'normal' ? 'Green' : 'Grey')
            .addFields(
                { name: 'Invited By', value: inviter ? `<@${inviter}>` : (joinType === 'vanity' ? 'Vanity URL' : 'Unknown'), inline: true },
                { name: 'Invite Code', value: usedInvite?.code || 'Unknown', inline: true }
            )
            .setTimestamp();

        await invitelogChannel?.send({ embeds: [embed] });
    }
};