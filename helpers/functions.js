// helpers/functions.js

function generateInvitesCache(invites) {
    const cache = {};
    invites.forEach(inv => {
        cache[inv.code] = {
            code: inv.code,
            inviter: inv.inviter?.id || null,
            uses: inv.uses
        };
    });
    return cache;
}

module.exports = {
    generateInvitesCache
};
