const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { hasStaffPermission } = require('../utils/permissionCheck');
const { parseTime, formatTime, wait } = require('../helpers/functions');
const { activeGames, runWheel, countdown, eliminatePlayer } = require ('../helpers/STWfunctions.js')
require('dotenv').config();

const ALLOWED_CHANNELS = new Set([
    '1345717289282043946',
    '1345717291089662077'
]);

module.exports = {
    name: 'spinthewheel',
    async handleSpinTheWheel(interaction) {
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
            const channel = interaction.channel;

            // Permissions check
            if (!hasStaffPermission(interaction.member)) {
                return interaction.reply({ content: "❌ Only staff can use this command.", ephemeral: true });
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
                title
            };
            activeGames.set(channel.id, gameData);

            const embed = new EmbedBuilder()
                .setTitle(`🎡 Spin The Wheel – ${title}`)
                .setDescription([
                    `**Participants:** 0`,
                    `**Ends:** <t:${Math.floor((Date.now() + time * 1000) / 1000)}:R>`
                ].join('\n'))
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

                    embed.setDescription([
                        `**Participants:** ${game.participants.size}`,
                        `**Ends:** <t:${Math.floor(game.endTime / 1000)}:R>`
                    ].join('\n'));

                    await msg.edit({ embeds: [embed], components: [row] });

                    if (remaining <= 0) {
                        clearInterval(updateInterval);
                        await msg.edit({ components: [] });
                        await runWheel(interaction, game.participants, game.title);
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
