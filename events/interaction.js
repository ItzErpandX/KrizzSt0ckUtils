const { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle, PermissionsBitField, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const db = require('../database');
const { CATEGORY_ID, STAFF_ROLE_ID, TICKET_MANAGER_ROLE_ID } = require('../config');
const { generateTranscript } = require('../utils/transcript');
const { hasStaffPermission, canOverrideClaim } = require('../utils/permissionCheck');
const { handleTicketPanel } = require('../commands/ticket-panel');
const { handleTicketManagerRole } = require('../commands/getticketmanagerrole');
const { handleInvitedList } = require('../commands/invitedlist');
const { handleAdd } = require('../commands/add');
const { handleRemove } = require('../commands/remove');
const { handleRejoins } = require('../commands/rejoins');
const { handleClose } = require('../commands/close');
const { handleRename } = require('../commands/rename');
const { handleBannerCommand } = require('../commands/banner');
const { handleResetInvites } = require('../commands/resetinvites');
const leaderboardCommand = require('../commands/leaderboard');
const { incrementUserStat } = require('../helpers/statistics');
const { handleCheckRejoin } = require('../commands/checkrejoin');
const { handleInfo } = require('../commands/info');
const { handleStats } = require('../commands/stats.js');
const { handleStatEdit } = require('../commands/statedit.js');
const { handleRizz } = require('../commands/rizz.js');
const { handleWarn } = require('../commands/warn.js');
const { handleRemoveWarn } = require('../commands/removewarn.js');
const { handleResetWarns } = require('../commands/resetwarns.js');
const { handleWarnings } = require('../commands/warnings.js');
const { handleSay } = require('../commands/say.js');
const { handleSpinTheWheel } = require('../commands/spinthewheel.js')
const { handleForceClean } = require('../commands/forcecleanstwgames.js')
//const { handleRape } = require('../commands/rape.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isCommand()) {
            const cmd = interaction.commandName;
            if (cmd === 'ticket-panel') return handleTicketPanel(interaction);
            if (cmd === 'getticketmanagerrole') return handleTicketManagerRole(interaction);
            if (cmd === 'add') return handleAdd(interaction);
            if (cmd === 'say') return handleSay(interaction);
            if (cmd === 'remove') return handleRemove(interaction);
            if (cmd === 'close') return handleClose(interaction);
            if (cmd === 'rename') return handleRename(interaction);
            if (cmd === 'rejoins') return handleRejoins(interaction);
//            if (cmd === 'rape') return handleRape(interaction);
            if (cmd === 'banner') return handleBannerCommand(interaction);
            if (cmd === 'invitedlist') return handleInvitedList(interaction);
            if (cmd === 'warn') return handleWarn(interaction);
            if (cmd === 'removewarn') return handleRemoveWarn(interaction);
            if (cmd === 'resetwarns') return handleResetWarns(interaction);
            if (cmd === 'warnings') return handleWarnings(interaction);
            if (cmd === 'resetinvites') return handleResetInvites(interaction);
            if (cmd === 'rizz') return handleRizz(interaction);
            if (cmd === 'info') return handleInfo(interaction);
            if (cmd === 'spinthewheel') return handleSpinTheWheel(interaction);
            if (cmd === 'forcecleanstwgames') return handleForceClean(interaction);
            if (cmd === 'checkrejoin') return handleCheckRejoin(interaction);
            if (cmd === 'stats') {
                return handleStats(interaction);
            } 
            if (cmd === 'statedit') {
                return handleStatEdit(interaction);
            }
            if (cmd === 'leaderboard') {
                await leaderboardCommand.handleLeaderboard(interaction);
            }
        }

        if (interaction.isButton()) {
            const { customId, member, channel } = interaction;

            if (customId === 'create_ticket') {
                const existingTicket = db.prepare("SELECT channel_id FROM tickets WHERE user_id = ?").get(member.id);
                if (existingTicket) {
                    return interaction.reply({ content: `❌ You already have an open ticket: <#${existingTicket.channel_id}>`, ephemeral: true });
                }

                const modal = new ModalBuilder()
                    .setCustomId('ticket_reason_modal')
                    .setTitle('🎫 Ticket Creation')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('ticket_reason')
                                .setLabel('Why are you opening this ticket?')
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(true)
                        )
                    );

                return interaction.showModal(modal);
            }

            // Claim Ticket
            if (interaction.customId === 'claim_ticket') {
                if (!hasStaffPermission(interaction.member)) {
                    return interaction.reply({ content: "❌ Only staff or higher can claim tickets.", ephemeral: true });
                }
            
                const ticketData = db.prepare("SELECT * FROM tickets WHERE channel_id = ?").get(channel.id);
                if (!ticketData) {
                    return interaction.reply({ content: "❌ This is not a valid ticket channel.", ephemeral: true });
                }
            
                if (ticketData.staff_id) {
                    return interaction.reply({ content: "❌ This ticket is already claimed.", ephemeral: true });
                }
            
                // Update DB to set claimer
                const userId = interaction.user.id;
                incrementUserStat(userId, 'tickets_claimed');
                db.prepare("UPDATE tickets SET staff_id = ? WHERE channel_id = ?").run(member.id, channel.id);
            
                // Set permissions
                await channel.permissionOverwrites.edit(STAFF_ROLE_ID, { SendMessages: false }); // Prevent other staff from writing
                await channel.permissionOverwrites.edit(member.id, { SendMessages: true });

                await channel.send(`✅ Ticket has been claimed by **${member.user.tag}**.`);
                return interaction.reply({ content: "✅ You have successfully claimed this ticket.", ephemeral: true });
            }

            // Unclaim logic
            if (interaction.customId === 'unclaim_ticket') {
                if (!hasStaffPermission(interaction.member)) {
                    return interaction.reply({ content: "❌ Only staff or higher can unclaim tickets.", ephemeral: true });
                }
            
                const ticketData = db.prepare("SELECT * FROM tickets WHERE channel_id = ?").get(channel.id);
                if (!ticketData) {
                    return interaction.reply({ content: "❌ This is not a valid ticket channel.", ephemeral: true });
                }
            
                if (ticketData.staff_id !== member.id) {
                    return interaction.reply({ content: "❌ You can only unclaim tickets that you claimed.", ephemeral: true });
                }
            
                // Update DB
                const userId = interaction.user.id;
                incrementUserStat(userId, 'tickets_unclaimed');
                db.prepare("UPDATE tickets SET staff_id = NULL WHERE channel_id = ?").run(channel.id);
            
                // Reset permissions
                await channel.permissionOverwrites.edit(STAFF_ROLE_ID, { SendMessages: true }); // Staff can now claim again
                await channel.permissionOverwrites.edit(member.id, { SendMessages: false });

                await channel.send(`✅ Ticket has been unclaimed and is now available for staff to claim.`);
                return interaction.reply({ content: "✅ You have successfully unclaimed this ticket.", ephemeral: true });
            }

            // Toggle ticket manager role
            if (interaction.isButton() && interaction.customId === 'toggle_ticket_manager_role') {
                const member = interaction.member;
            
                if (member.roles.cache.has(TICKET_MANAGER_ROLE_ID)) {
                    // If member already has role, remove it
                    await member.roles.remove(TICKET_MANAGER_ROLE_ID);
                    await interaction.reply({ content: '❌ Ticket Manager role removed!', ephemeral: true });
                } else {
                    // If member doesn't have role, give it
                    await member.roles.add(TICKET_MANAGER_ROLE_ID);
                    await interaction.reply({ content: '✅ Ticket Manager role assigned!', ephemeral: true });
                }
            }

            // Force claim
            if (interaction.customId === 'force_claim_ticket') {
                if (!hasStaffPermission(interaction.member)) {
                    return interaction.reply({ content: "❌ Only staff members can use this button.", ephemeral: true });
                }
            
                const ticketData = db.prepare("SELECT * FROM tickets WHERE channel_id = ?").get(channel.id);
                if (!ticketData) {
                    return interaction.reply({ content: "❌ This is not a valid ticket channel.", ephemeral: true });
                }
            
                if (!ticketData.staff_id) {
                    return interaction.reply({ content: "❌ This ticket is unclaimed. Use the normal claim button.", ephemeral: true });
                }
            
                const currentClaimer = await channel.guild.members.fetch(ticketData.staff_id).catch(() => null);
                if (!currentClaimer) {
                    return interaction.reply({ content: "⚠️ Could not find the current claimer. You may claim normally.", ephemeral: true });
                }
            
                if (!canOverrideClaim(member, currentClaimer)) {
                    return interaction.reply({ content: `❌ You cannot force claim this ticket. It's claimed by **${currentClaimer.user.tag}**, who has a higher or equal role.`, ephemeral: true });
                }
            
                // Set new claimer in DB
                const userId = interaction.user.id;
                incrementUserStat(userId, 'tickets_force_claimed');
                db.prepare("UPDATE tickets SET staff_id = ? WHERE channel_id = ?").run(member.id, channel.id);
            
                // Update permissions
                await channel.permissionOverwrites.edit(currentClaimer.id, { SendMessages: false }); // Remove from old claimer
                await channel.permissionOverwrites.edit(member.id, { SendMessages: true }); // Add to new claimer
            
                // Staff can't write anymore (claimed)
                await channel.permissionOverwrites.edit(STAFF_ROLE_ID, { SendMessages: false });

                await channel.send(`⚠️ **${member.user.tag}** has force-claimed this ticket.`);
                return interaction.reply({ content: "✅ You have successfully force-claimed this ticket.", ephemeral: true });
            }

            // Close Ticket
            if (customId === 'close_ticket') {

                if (!hasStaffPermission(interaction.member)) {
                    return interaction.reply({ content: "❌ Only staff members can close tickets.", ephemeral: true });
                }

                const ticketData = db.prepare("SELECT * FROM tickets WHERE channel_id = ?").get(channel.id);
                db.prepare("DELETE FROM tickets WHERE channel_id = ?").run(channel.id);
                db.prepare("DELETE FROM ticket_members WHERE channel_id = ?").run(channel.id);
                if (!ticketData) {
                    return interaction.reply({ content: "❌ This ticket is already scheduled for deleting.", ephemeral: true });
                }

                await interaction.reply({ content: "📜 Saving transcript, please wait...", ephemeral: true });
                try {
                    await generateTranscript(channel, interaction.member);
                } catch (err) {
                    console.error("❌ Error generating transcript:", err);
                }

                const userId = interaction.user.id;
                incrementUserStat(userId, 'tickets_closed');
                
                await channel.send("🔒 Ticket will close in 10 seconds.");
                setTimeout(() => channel.delete().catch(console.error), 10000);
            }
        }

        // Modal Submission
        if (interaction.isModalSubmit() && interaction.customId === 'ticket_reason_modal') {

            // moving const member and channel here first so
            // we can fetch the member and channel's id later
            const member = interaction.member;
            const channel = interaction.channel;
            
            // cancels the ticket creation if user already has ticket
            // this serves as a fix for that rare glitch where people can create 2 tickets at the same time
            // if modal fails to close for some reason
            const existingTicket = db.prepare("SELECT channel_id FROM tickets WHERE user_id = ?").get(member.id);
                if (existingTicket) {
                    return interaction.reply({
                        content: `❌ You already have an open ticket: <#${existingTicket.channel_id}>`,
                        ephemeral: true,
                    });
                }

            const reason = interaction.fields.getTextInputValue('ticket_reason');
            const guild = interaction.guild;
            const ticketData = db.prepare("SELECT * FROM tickets WHERE channel_id = ?").get(channel.id);
            const ticketClaimed = ticketData && ticketData.staff_id;
            const userId = interaction.user.id;
            incrementUserStat(userId, 'tickets_opened');

            const ticketChannel = await guild.channels.create({
                name: `ticket-${member.user.username}`,
                type: 0, // 0 = GUILD_TEXT
                parent: CATEGORY_ID,
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: member.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                    { id: STAFF_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                ]
            });

            db.prepare("INSERT INTO tickets (channel_id, user_id) VALUES (?, ?)").run(ticketChannel.id, member.id);

            const embed = new EmbedBuilder()
                .setTitle('🎫 Ticket Created')
                .setDescription('A staff member will be with you shortly.\nClick "Close" if you want to close this ticket.')
                .setColor(0x00FF00)
                .addFields({ name: '📌 Reason', value: reason });


            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('claim_ticket').setLabel('Claim').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('unclaim_ticket').setLabel('Unclaim Ticket').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('force_claim_ticket').setLabel('Force Claim').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger)
            );

            const ticketMessage = await ticketChannel.send({ content: `<@${member.id}>, <@&${TICKET_MANAGER_ROLE_ID}>`, embeds: [embed], components: [row] });
            await ticketMessage.pin(); 
            await interaction.reply({ content: `✅ Ticket created: ${ticketChannel}`, ephemeral: true });
        }
    }
};

