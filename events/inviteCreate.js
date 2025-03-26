const { generateInvitesCache } = require('../helpers/functions');

module.exports = {
    name: 'inviteCreate',
    async execute(invite) {
        const guildId = invite.guild.id;
        const client = invite.client;

        if (!client.invitations[guildId]) client.invitations[guildId] = {};

        client.invitations[guildId][invite.code] = {
            code: invite.code,
            inviter: invite.inviter?.id || null,
            uses: invite.uses
        };

        console.log(`✅ [INVITE CREATED] Code: ${invite.code} for guild: ${guildId}`);
    }
};
