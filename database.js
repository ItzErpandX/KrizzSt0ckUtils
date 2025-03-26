const sqlite3 = require('better-sqlite3');
const db = new sqlite3('./database.sqlite');

db.prepare(`CREATE TABLE IF NOT EXISTS panel (message_id TEXT PRIMARY KEY, channel_id TEXT)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS tickets (channel_id TEXT PRIMARY KEY, user_id TEXT, staff_id TEXT DEFAULT NULL)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS ticket_members (channel_id TEXT, member_id TEXT, PRIMARY KEY (channel_id, member_id))`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS rejoins (user_id TEXT PRIMARY KEY, username TEXT, inviter_id TEXT, first_joined_at TEXT)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS invites (user_id TEXT PRIMARY KEY, inviter_id TEXT, joined_at TEXT, left_at TEXT)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS all_invites (code TEXT PRIMARY KEY, inviter_id TEXT, created_at TEXT, max_uses INTEGER, max_age INTEGER, is_deleted INTEGER DEFAULT 0)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS ticket_stats (user_id TEXT PRIMARY KEY, tickets_opened INTEGER DEFAULT 0, tickets_closed INTEGER DEFAULT 0, tickets_claimed INTEGER DEFAULT 0, tickets_unclaimed INTEGER DEFAULT 0, tickets_force_claimed INTEGER DEFAULT 0, tickets_message_sent INTEGER DEFAULT 0, tickets_staff_message_sent INTEGER DEFAULT 0)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS warnings (warn_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, moderator_id TEXT NOT NULL, reason TEXT, timestamp TEXT, expires_at TEXT)`).run();


module.exports = db;
