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

function incrementMessageCount(userId) {
    const exists = db.prepare('SELECT * FROM user_messages WHERE user_id = ?').get(userId);

    if (!exists) {
        db.prepare(`
            INSERT INTO user_messages (user_id, message_count) 
            VALUES (?, 1)
        `).run(userId);
    } else {
        db.prepare(`
            UPDATE user_messages
            SET message_count = message_count + 1
            WHERE user_id = ?
        `).run(userId);
    }
}

module.exports = { incrementUserStat, incrementMessageCount };
