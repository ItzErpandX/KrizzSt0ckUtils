const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, Events } = require('discord.js');
const { hasStaffPermission } = require('../utils/permissionCheck');
const { parseTime } = require('../helpers/functions');
const { activeGames, runWheel } = require('../helpers/STWfunctions.js');
const db = require('../database'); 
require('dotenv').config();

const ALLOWED_CHANNELS = new Set([
    '1390974972599730186',
    '1406661351434092545'
]);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spinthewheel')
        .setDescription('Start a spin the wheel game')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Title of the spin the wheel game')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration of the game (e.g., 1m, 30s, 2h, 1d)')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('min_messages')
                .setDescription('Minimum messages required to join (optional)')
                .setRequired(false))
        .addChannelOption(option =>
            option.setName('voice_channel')
                .setDescription('Voice channel requirement (optional)')
                .setRequired(false)),
    
    async execute(interaction) {
        try {
            // Channel check
            if (!ALLOWED_CHANNELS.has(interaction.channel.id)) {
                return interaction.reply({
                    content: '❌ Command not allowed in this channel!',
                    ephemeral: true
                });
            }

            const title = interaction.options.getString('title');
            const duration = interaction.options.getString('duration');
            const minMessages = interaction.options.getInteger('min_messages') || 0;
            const voiceChannel = interaction.options.getChannel('voice_channel');
            const channel = interaction.channel;

            // Permissions check
            if (!hasStaffPermission(interaction.member)) {
                return interaction.reply({ content: "❌ Only staff can use this command.", ephemeral: true });
            }

            if (voiceChannel && voiceChannel.type !== ChannelType.GuildVoice) {
                return interaction.reply({
                    content: '❌ The provided channel must be a voice channel!',
                    ephemeral: true
                });
            }

            // Game active check
            if (activeGames.has(channel.id)) {
                return interaction.reply({
                    content: '⚠️ A wheel is already active in this channel.',
                    ephemeral: true
                });
            }

            const time = parseTime(duration);
            if (time === null || time < 5 || time > 900) {
                return interaction.reply({
                    content: '❌ Invalid duration (5s-15m). Use: 30s, 1m, 3m, etc.',
                    ephemeral: true
                });
            }

            const participants = new Set();
            const gameData = {
                participants,
                endTime: Date.now() + time * 1000,
                title,
                minMessages,
                voiceChannel: voiceChannel ? voiceChannel.id : null
            };
            activeGames.set(channel.id, gameData);

            if (voiceChannel) {
                const voiceCheck = async (oldState, newState) => {
                    const game = activeGames.get(channel.id);
                    if (!game || !game.voiceChannel) return;

                    const userId = newState.member?.id;
                    if (!userId || !game.participants.has(userId)) return;

                    const isStillInVC = newState.channelId === game.voiceChannel;
                    if (!isStillInVC) {
                        game.participants.delete(userId);

                        try {
                            await newState.member.send(
                                `❌ You were removed from **${game.title}** because you left <#${game.voiceChannel}>`
                            );
                        } catch {
                            // Ignore DM errors
                        }
                    }
                };

                interaction.client.on(Events.VoiceStateUpdate, voiceCheck);
                gameData.voiceCheckListener = voiceCheck;
            }

            // Build description with requirements
            let description = [
                `**Participants:** 0`,
                `**Ends:** <t:${Math.floor((Date.now() + time * 1000) / 1000)}:R>`
            ];

            if (minMessages > 0) {
                description.push(`**Message Requirement:** ${minMessages}+ messages`);
            }

            if (voiceChannel) {
                description.push(`**Voice Channel:** <#${voiceChannel.id}>`);
            }

            const embed = new EmbedBuilder()
                .setTitle(`🎡 Spin The Wheel – ${title}`)
                .setDescription(description.join('\n'))
                .setColor('#FFD700');

            const joinButton = new ButtonBuilder()
                .setCustomId('join_drop')
                .setLabel('Join Drop')
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder().addComponents(joinButton);

            const msg = await interaction.reply({
                embeds: [embed],
                components: [row],
                fetchReply: true
            });

            // Update interval
            const updateInterval = setInterval(async () => {
                try {
                    const game = activeGames.get(channel.id);
                    if (!game) {
                        clearInterval(updateInterval);
                        return;
                    }

                    const remaining = Math.max(0, Math.ceil((game.endTime - Date.now()) / 1000));

                    // Update description with current participants
                    let updatedDescription = [
                        `**Participants:** ${game.participants.size}`,
                        `**Ends:** <t:${Math.floor(game.endTime / 1000)}:R>`
                    ];

                    if (game.minMessages > 0) {
                        updatedDescription.push(`**Message Requirement:** ${game.minMessages}+ messages`);
                    }

                    if (game.voiceChannel) {
                        updatedDescription.push(`**Voice Channel:** <#${game.voiceChannel}>`);
                    }
                    
                    embed.setDescription(updatedDescription.join('\n'));

                    await msg.edit({ embeds: [embed], components: [row] });

                    if (remaining <= 0) {
                        clearInterval(updateInterval);
                        await msg.edit({ components: [] });
                        if (gameData.voiceCheckListener) {
                            interaction.client.off(Events.VoiceStateUpdate, gameData.voiceCheckListener);
                        }
                        if (game.voiceChannel) {
                            await runWheel(interaction, game.participants, game.title, game.voiceChannel);
                        }
                        else if (game.voiceChannel === null) {
                            await runWheel(interaction, game.participants, game.title);
                        }
                    }
                } catch (error) {
                    console.error('Update error:', error);
                    clearInterval(updateInterval);
                }
            }, 1000);

            // Collect participants
            const collector = msg.createMessageComponentCollector({
                filter: i => i.customId === 'join_drop',
                time: time * 1000
            });

            collector.on('collect', async i => {
                try {
                    const game = activeGames.get(channel.id);
                    if (!game) {
                        return i.reply({
                            content: '⚠️ This game has ended!',
                            ephemeral: true
                        });
                    }

                    if (game.participants.has(i.user.id)) {
                        return i.reply({
                            content: '⚠️ You already joined!',
                            ephemeral: true
                        });
                    }

                    // Check message count requirement
                    if (game.minMessages > 0) {
                        const userMessages = db.prepare('SELECT message_count FROM user_messages WHERE user_id = ?').get(i.user.id);
                        const messageCount = userMessages ? userMessages.message_count : 0;
                        
                        if (messageCount < game.minMessages) {
                            return i.reply({
                                content: `❌ You need at least ${game.minMessages} messages to join this drop!`,
                                ephemeral: true
                            });
                        }
                    }

                    // Check voice channel requirement
                    if (game.voiceChannel) {
                        const member = await i.guild.members.fetch(i.user.id);
                        if (!member.voice.channel || member.voice.channel.id !== game.voiceChannel) {
                            return i.reply({
                                content: `❌ You must be in the voice channel <#${game.voiceChannel}> to join this drop!`,
                                ephemeral: true
                            });
                        }
                    }

                    game.participants.add(i.user.id);
                    await i.reply({
                        content: '✅ You joined the drop!',
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('Button error:', error);
                }
            });

        } catch (error) {
            console.error('Command error:', error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ An error occurred while setting up the game.',
                    ephemeral: true
                });
            }
        }
    }
};