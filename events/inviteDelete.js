module.exports = {
    name: 'inviteDelete',
    async execute(invite) {
        const guildId = invite.guild.id;
        const client = invite.client;

        if (client.invitations[guildId] && client.invitations[guildId][invite.code]) {
            delete client.invitations[guildId][invite.code];
            console.log(`❌ [INVITE DELETED] Code: ${invite.code} removed from cache for guild: ${guildId}`);
        }
    }
};
