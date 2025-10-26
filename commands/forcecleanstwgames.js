const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { hasStaffPermission } = require('../utils/permissionCheck');
const { activeGames } = require('../helpers/STWfunctions');

module.exports = {
    name: 'forcecleanstwgames',
    async handleForceClean(interaction) {
        if (!hasStaffPermission(interaction.member)) {
            return interaction.reply({ 
                content: "❌ Only staff can use this command.", 
                ephemeral: true 
            });
        }

        // Create confirmation buttons
        const confirmBtn = new ButtonBuilder()
            .setCustomId('confirm_clean')
            .setLabel('Confirm Cleanup')
            .setStyle(ButtonStyle.Danger);
        
        const cancelBtn = new ButtonBuilder()
            .setCustomId('cancel_clean')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(cancelBtn, confirmBtn);

        // Send confirmation
        const response = await interaction.reply({
            content: '⚠️ Are you sure you want to clear ALL active Spin the Wheel games?',
            components: [row],
            ephemeral: false,
            fetchReply: true
        });

        // Handle button responses
        const collector = response.createMessageComponentCollector({ 
            time: 15000 
        });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ 
                    content: "❌ This confirmation isn't for you!", 
                    ephemeral: false 
                });
            }

            if (i.customId === 'confirm_clean') {
                const count = activeGames.size;
                // Proper way to clear the Map
                for (const [key] of activeGames) {
                    activeGames.delete(key);
                }
                await i.update({
                    content: `♻️ Cleared ${count} active games.`,
                    components: []
                });
            } else {
                await i.update({
                    content: '✅ Cleanup cancelled.',
                    components: []
                });
            }
            collector.stop();
        });

        collector.on('end', () => {
            if (!response.editable) return;
            response.edit({ components: [] }).catch(() => {});
        });
    }
};