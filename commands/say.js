const { PermissionFlagsBits } = require('discord.js');
require('dotenv').config(); 

async function handleSay(interaction) {

    if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: '❌ Only my owner can use this command', ephemeral: true });
    }

    const message = interaction.options.getString('message');
    
    if (!message) {
        return interaction.reply({ content: '❌ Please provide a message to send.', ephemeral: true });
    }

    await interaction.reply({ content: '✅ Message sent!', ephemeral: true });
    await interaction.channel.send(message);
}

module.exports = { handleSay };
