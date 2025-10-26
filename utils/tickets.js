const db = require('../database');

module.exports = {
    isTicketChannel(channelId) {
        // Assuming you store ticket channels in a `tickets` table
        const ticket = db.prepare('SELECT * FROM tickets WHERE channel_id = ?').get(channelId);
        return !!ticket; // return true if exists, otherwise false
    }
};
