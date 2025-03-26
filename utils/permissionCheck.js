const { STAFF_ROLE_ID, CHAT_ADMIN_ROLE_ID } = require('../config');

function hasStaffPermission(member) {
    const staffRole = member.guild.roles.cache.get(STAFF_ROLE_ID);
    if (!staffRole) return false;
    return member.roles.highest.position >= staffRole.position;
}

function hasChatAdmin(member) {
    const chatAdmin = member.guild.roles.cache.get(CHAT_ADMIN_ROLE_ID);
    if (!chatAdmin) return false;
    return member.roles.highest.position >= chatAdmin.position;
}

function canOverrideClaim(member, currentClaimer) {
    return member.roles.highest.position > currentClaimer.roles.highest.position;
}

module.exports = { hasStaffPermission, canOverrideClaim, hasChatAdmin };
