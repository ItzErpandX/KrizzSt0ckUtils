const db = require('../database');

function incrementUserStat(userId, column) {
    const exists = db.prepare('SELECT * FROM ticket_stats WHERE user_id = ?').get(userId);

    if (!exists) {
        db.prepare(`
            INSERT INTO ticket_stats (user_id, ${column}) 
            VALUES (?, 1)
        `).run(userId);
    } else {
        db.prepare(`
            UPDATE ticket_stats
            SET ${column} = ${column} + 1
            WHERE user_id = ?
        `).run(userId);
    }
}

module.exports = { incrementUserStat };
