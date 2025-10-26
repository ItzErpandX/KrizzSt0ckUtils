const { Events, PermissionsBitField } = require('discord.js');
const db = require('../database.js');

const cooldowns = new Map();

const requiredPerms = [
  PermissionsBitField.Flags.ViewChannel,
  PermissionsBitField.Flags.SendMessages,
  PermissionsBitField.Flags.ReadMessageHistory,
];

const isOlderThan = (msg, ms) => Date.now() - msg.createdTimestamp > ms;

async function safeSend(channel, content, retries = 2) {
  try {
    return await channel.send(content);
  } catch {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 2000));
      return safeSend(channel, content, retries - 1);
    }
    return null;
  }
}

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

    const sticky = db.prepare('SELECT * FROM sticky_messages WHERE channel_id = ?').get(message.channelId);
    if (!sticky) return;

    const me = message.guild.members.me;
    if (!me.permissionsIn(message.channel).has(requiredPerms)) {
      db.prepare('DELETE FROM sticky_messages WHERE channel_id = ?').run(message.channelId);
      console.warn(`[Sticky] Removed from #${message.channel.name} (no perms)`);
      return;
    }

    const now = Date.now();
    const cooldown = cooldowns.get(message.channelId) || 0;
    if (now < cooldown) return;
    cooldowns.set(message.channelId, now + 10_000); // 10s cooldown

    try {
      const history = await message.channel.messages.fetch({ limit: 8 });
      const messages = Array.from(history.values());
      const stickyMessage = messages.find(m => m.id === sticky.last_message_id && m.author.id === message.client.user.id);

      if (stickyMessage && isOlderThan(stickyMessage, 15000)) {
        await stickyMessage.delete().catch(() => {});
        const newMsg = await safeSend(message.channel, sticky.message);
        if (newMsg)
          db.prepare('UPDATE sticky_messages SET last_message_id = ? WHERE channel_id = ?').run(newMsg.id, message.channelId);
        return;
      }

      const stickyVisible = messages.slice(0, 5).some(m => m.id === sticky.last_message_id && m.author.id === message.client.user.id);
      if (!stickyVisible) {
        if (sticky.last_message_id)
          await message.channel.messages.delete(sticky.last_message_id).catch(() => {});
        const newMsg = await safeSend(message.channel, sticky.message);
        if (newMsg)
          db.prepare('UPDATE sticky_messages SET last_message_id = ? WHERE channel_id = ?').run(newMsg.id, message.channelId);
        else {
          db.prepare('DELETE FROM sticky_messages WHERE channel_id = ?').run(message.channelId);
          console.warn(`[Sticky] Removed from #${message.channel.name} (send failure)`);
        }
      }

      const allStickies = messages.filter(m => m.author.id === message.client.user.id && m.content === sticky.message);
      if (allStickies.length > 1) {
        allStickies.sort((a, b) => b.createdTimestamp - a.createdTimestamp);
        const [, ...dupes] = allStickies;
        for (const d of dupes) d.delete().catch(() => {});
      }
    } catch (error) {
      console.error(`[Sticky] Error in #${message.channel.name}:`, error);
    }
  },
};
