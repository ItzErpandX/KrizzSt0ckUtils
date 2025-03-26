const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const { TICKET_MANAGER_ROLE_ID } = require('../config');

module.exports = {
    name: 'getticketmanagerrole', // Name of the command
    async handleTicketManagerRole(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('🎫 Ticket Manager Role')
            .setDescription('Click the button below to toggle the Ticket Manager role.')
            .setFooter({
                text: 'By having this role you will get pinged when a new ticket is opened.',
            })
            .setColor(0x0000FF); // Set the color to blue

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('toggle_ticket_manager_role')
                .setLabel('Toggle Ticket Manager Role')
                .setStyle(ButtonStyle.Success)
        );

        const message = await interaction.channel.send({ embeds: [embed], components: [row] });
        return interaction.reply({ content: "✅ Embed panel sent successfully!", ephemeral: true });
    }
};
