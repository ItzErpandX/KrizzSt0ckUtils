const db = require('../database');

function cleanupExpiredWarnings() {
    const now = new Date().toISOString();

    console.log(`No expired warnings found...`)
    
    const expiredWarnings = db.prepare('DELETE FROM warnings WHERE expires_at <= ?').run(now);

    if (expiredWarnings.changes > 0) {
        console.log(`🗑️ Removed ${expiredWarnings.changes} expired warnings.`);
    }
}

// Run cleanup every hour
setInterval(cleanupExpiredWarnings, 60 * 60 * 1000);

module.exports = { cleanupExpiredWarnings };
