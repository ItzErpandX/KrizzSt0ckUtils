const db = require('../database');

module.exports = {
    isTicketChannel(channelId) {
        const ticket = db.prepare('SELECT * FROM tickets WHERE channel_id = ?').get(channelId);
        return !!ticket;
    }
};
