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
        const cachedInvites = client.invitations[member.guild.id] || {};

        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for Discord to update invites

        const newInvitesRaw = await member.guild.invites.fetch().catch(() => null);
        if (!newInvitesRaw) return console.error(`❌ Couldn't fetch invites for ${member.guild.name}`);
        const newInvites = {};
        newInvitesRaw.forEach(inv => {
            newInvites[inv.code] = {
                code: inv.code,
                inviter: inv.inviter?.id || null,
                uses: inv.uses
            };
        });
        client.invitations[member.guild.id] = newInvites;

        let usedInvite = null;

        for (const code in newInvites) {
            const newInvite = newInvites[code];
            const cachedInvite = cachedInvites[code];
            if (cachedInvite && newInvite.uses > cachedInvite.uses) {
                usedInvite = newInvite;
                break;
            }
        }

        if (!usedInvite) {
            for (const code in newInvites) {
                const newInvite = newInvites[code];
                if (!cachedInvites[code] && newInvite.uses === 1) {
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
                    { name: 'Originally Invited By', value: rejoinData.inviter_id ? `<@${rejoinData.inviter_id}>` : 'Unknown', inline: true },
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
