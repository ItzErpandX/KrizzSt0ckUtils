const db = require('../database');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member) {
        const userId = member.id;

        // ✅ 1. Track for potential rejoin
        const existing = db.prepare('SELECT * FROM rejoins WHERE user_id = ?').get(userId);
        if (!existing) {
            db.prepare('INSERT INTO rejoins (user_id, username, first_joined_at) VALUES (?, ?, ?)').run(
                userId,
                member.user.tag,
                new Date().toISOString()
            );
            console.log(`[REJOIN TRACK] Saved ${member.user.tag} as potential rejoin.`);
        } else {
            console.log(`[REJOIN TRACK] ${member.user.tag} is already tracked for potential rejoin.`);
        }

        // ✅ 2. Mark invite as left (soft delete, keeps history)
        const invitedBy = db.prepare('SELECT * FROM invites WHERE user_id = ?').get(userId);
        if (invitedBy) {
            db.prepare('UPDATE invites SET left_at = ? WHERE user_id = ?').run(new Date().toISOString(), userId);
            console.log(`✅ Marked invite as left for ${member.user.tag}, invited by <@${invitedBy.inviter_id}>`);
        } else {
            console.log(`[INVITE TRACK] ${member.user.tag} had no invite record.`);
        }
    }
};
