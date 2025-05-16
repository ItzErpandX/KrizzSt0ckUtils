const { REST, Routes, SlashCommandBuilder, ActivityType } = require('discord.js');
const { CLIENT_ID, GUILD_ID, TOKEN } = require('../config');
const { bannerCommand } = require('../commands/banner');
const stateditCommand = require('../commands/statedit');
const { generateInvitesCache } = require('../helpers/functions');
const { incrementUserStat } = require('../helpers/statistics');
const { isTicketChannel } = require('../utils/tickets');
const { hasStaffPermission } = require('../utils/permissionCheck');
const { cleanupExpiredWarnings } = require('../tasks/cleanupWarnings');
const Discord = require('discord.js');
const CronJob = require('cron').CronJob;
const invitesCache = {};


module.exports = {
    name: 'ready',
    async execute(client) {

        console.log("")
        console.log("")
        console.log("")
        console.log(`██╗  ██╗██████╗ ██╗███████╗███████╗    ███████╗████████╗ ██████╗  ██████╗██╗  ██╗
██║ ██╔╝██╔══██╗██║╚══███╔╝╚══███╔╝    ██╔════╝╚══██╔══╝██╔═████╗██╔════╝██║ ██╔╝
█████╔╝ ██████╔╝██║  ███╔╝   ███╔╝     ███████╗   ██║   ██║██╔██║██║     █████╔╝ 
██╔═██╗ ██╔══██╗██║ ███╔╝   ███╔╝      ╚════██║   ██║   ████╔╝██║██║     ██╔═██╗ 
██║  ██╗██║  ██║██║███████╗███████╗    ███████║   ██║   ╚██████╔╝╚██████╗██║  ██╗
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝    ╚══════╝   ╚═╝    ╚═════╝  ╚═════╝╚═╝  ╚═╝`);
        console.log("Made by ItzErpandX with <3 for Krizz St0ck")
        console.log(`${client.user.tag} is online!`);

        client.user.setPresence({
            activities: [{ name: "Krizz St0ck", type: ActivityType.Watching }],
            status: "idle"
        });

        client.guilds.cache.forEach(async (guild) => {
            try {
                const member = await guild.members.fetch(client.user.id);
                if (member.permissions.has(Discord.PermissionsBitField.Flags.ManageGuild)) {
                    const invites = await guild.invites.fetch();
                    invitesCache[guild.id] = generateInvitesCache(invites);
                    console.log(`✅ Cached invites for ${guild.name}`);
                } else {
                    console.log(`⚠️ Bot lacks permission to fetch invites in ${guild.name}`);
                }
            } catch (err) {
                console.error(`❌ Failed to fetch invites for ${guild.name}:`, err);
            }
        });

        const commands = [
            //add
            new SlashCommandBuilder().setName('add').setDescription('Add a member to the ticket (Staff only)').addUserOption(option => option.setName('member').setDescription('Member').setRequired(true)),
            //forcecleanstwgames
            new SlashCommandBuilder().setName('forcecleanstwgames').setDescription('Force stop all stw games (Staff only)'),   
            //rape
            new SlashCommandBuilder().setName('rape').setDescription('rape someone').addUserOption(option => option.setName('member').setDescription('Member').setRequired(true)),
            //banner
            bannerCommand.toJSON(),
            //checkrejoin
            new SlashCommandBuilder()
                .setName('checkrejoin')
                .setDescription('Check all rejoin records of a user (Staff only).')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to check.')
                        .setRequired(true)
                ),
            //close
            new SlashCommandBuilder().setName('close').setDescription('Close the ticket (Staff only)'),                
            //getticketmanagerrole
            new SlashCommandBuilder().setName('getticketmanagerrole').setDescription('Pops up the embed for ticket manager role toggle (Admin only)'),            
            //info
            new SlashCommandBuilder()
                .setName('info')
                .setDescription('Get detailed information about a user (Staff only).')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to get information about.')
                        .setRequired(true)
                ),
            //invitedlist
            new SlashCommandBuilder().setName('invitedlist').setDescription('Show who a user has invited. (Staff only)').addUserOption(option => option.setName('user').setDescription('User to check').setRequired(true)),                
            //leaderboard    
            new SlashCommandBuilder()
                .setName('leaderboard')
                .setDescription('Show ticket statistics leaderboard.')
                .addStringOption(option =>
                    option.setName('option')
                        .setDescription('Choose a leaderboard type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Tickets Opened', value: 'tickets_opened' },
                            { name: 'Tickets Closed', value: 'tickets_closed' },
                            { name: 'Tickets Claimed', value: 'tickets_claimed' },
                            { name: 'Tickets Unclaimed', value: 'tickets_unclaimed' },
                            { name: 'Tickets Force Claimed', value: 'tickets_force_claimed' },
                            { name: 'Tickets Message Sent', value: 'tickets_message_sent' },
                            { name: 'Tickets Staff Message Sent', value: 'tickets_staff_message_sent' }
                        )
                ),  
            //rejoins
            new SlashCommandBuilder().setName('rejoins').setDescription('Show all users who rejoined and were invited by a specific user. (Staff only)').addUserOption(option => option.setName('user').setDescription('The inviter to check for rejoins.').setRequired(true)),                
            //remove
            new SlashCommandBuilder().setName('remove').setDescription('Remove a member from the ticket (Staff only)').addUserOption(option => option.setName('member').setDescription('Member').setRequired(true)),
            //removewarn
            new SlashCommandBuilder().setName('removewarn').setDescription('Remove a specific warning. (Staff only)').addUserOption(option => option.setName('user').setDescription('User').setRequired(true)).addStringOption(option => option.setName('warn_id').setDescription('Warn ID').setRequired(true)),
            //rename
            new SlashCommandBuilder().setName('rename').setDescription('Rename the ticket (Staff only)').addStringOption(option => option.setName('name').setDescription('New ticket name').setRequired(true)),
            //resetinvites
            new SlashCommandBuilder()
                .setName('resetinvites')
                .setDescription('Reset invites for a user or all users. (Admin only)')

                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to reset invites for')
                        .setRequired(false)
                )

                .addBooleanOption(option =>
                    option.setName('all')
                        .setDescription('Reset invites for all users? (true/false)')
                        .setRequired(false)
                ),
            //resetwarns
            new SlashCommandBuilder().setName('resetwarns').setDescription('Reset warnings for a user or all. (Admin only)').addUserOption(option => option.setName('user').setDescription('The user whose warn you want to remove').setRequired(false)).addBooleanOption(option => option.setName('all').setDescription('Reset warns for all users? (true/false)').setRequired(false)),
            //rizz
            new SlashCommandBuilder().setName('rizz').setDescription('Send a random rizz line to a user').addUserOption(option => option.setName('user').setDescription('The user you want to rizz up').setRequired(true)),
            //say
            new SlashCommandBuilder().setName('say').setDescription('Make the bot send a message (Bot owner only)').addStringOption(option => option.setName('message').setDescription('the message for the bot to send').setRequired(true)),
            //statedit    
            stateditCommand.data.toJSON(),
            //stats    
            new SlashCommandBuilder()
                .setName('stats')
                .setDescription('View ticket stats of a user.')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user whose stats you want to check.')
                        .setRequired(true)
                ),
            //spinthewheel
            new SlashCommandBuilder()
                .setName('spinthewheel')
                .setDescription('Start a spin the wheel game')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('Title of the spin the wheel game')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('Duration of the game (e.g., 1m, 30s, 2h, 1d)')
                        .setRequired(true)
                ),
            //ticket-panel
            new SlashCommandBuilder().setName('ticket-panel').setDescription('Send the ticket panel (Admin only)'),                
            //warn
            new SlashCommandBuilder().setName('warn').setDescription('Warn a user. (Staff only)').addUserOption(option => option.setName('user').setDescription('User to warn').setRequired(true)).addStringOption(option => option.setName('reason').setDescription('Reason for warning').setRequired(true)),
            //warnings
            new SlashCommandBuilder().setName('warnings').setDescription('Check a user\'s warnings. (Staff only)').addUserOption(option => option.setName('user').setDescription('User to check').setRequired(true)),    
        ];

        const rest = new REST({ version: '10' }).setToken(TOKEN);
        try {
            await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
            console.log('✅ Commands registered successfully!');
            commands.forEach(command => {
                console.log(`- /${command.name}`);
            });
        } catch (error) {
            console.error('❌ Failed to register commands:', error);
        }

    new CronJob("0 */15 * * * *", async () => {
        console.log("⏰ Refreshing invites cache...");
        await client.guilds.cache.forEach(async (guild) => {
            try {
                const member = await guild.members.fetch(client.user.id);
                if (member.permissions.has(Discord.PermissionsBitField.Flags.ManageGuild)) {
                    const invites = await guild.invites.fetch();
                    invitesCache[guild.id] = generateInvitesCache(invites);
                    console.log(`✅ Refreshed invites for ${guild.name}`);
                }
            } catch (err) {
                console.error(`❌ Failed to refresh invites for ${guild.name}:`, err);
            }
        });
    }, null, true, "UTC");

    client.invitations = invitesCache;


    client.on('messageCreate', (message) => {
        if (message.author.bot) return;

        if (!isTicketChannel(message.channel.id)) {
            return;
        }

        if (hasStaffPermission(message.member)) {
            incrementUserStat(message.author.id, 'tickets_staff_message_sent');
        } else {
            incrementUserStat(message.author.id, 'tickets_message_sent');
        }
    });
        
//    client.on('messageCreate', async (message) => {
//    const customEmoji = '1355534833287303268';
//        try {
//            await message.react(customEmoji);
//        } catch (error) {
//            console.error('Error reacting with emoji:', error);
//        }
//    });
        

    cleanupExpiredWarnings();

    }       
};
