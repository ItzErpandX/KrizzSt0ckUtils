const { Client, GatewayIntentBits, Partials } = require('discord.js');
const antiCrash = require('./utils/anticrash');
const { loadEvents } = require('./events/loader');
require('dotenv').config();

const client = new Client({
    intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.AutoModerationConfiguration,
    GatewayIntentBits.AutoModerationExecution
    ],
    partials: [Partials.Channel]
});

antiCrash(client);
loadEvents(client);
client.login(process.env.TOKEN);