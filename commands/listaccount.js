const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const db = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listaccount')
        .setDescription('List an account for sale')
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('The image of the account')
                .setRequired(true)),
    
    async execute(interaction) {
        const allowedCategoryId = '1389882353391894589'; // Replace with your category ID

        // Check if the command is used in a channel under the allowed category
        if (!interaction.channel.parentId || interaction.channel.parentId !== allowedCategoryId) {
            return interaction.reply({
                content: 'You can only use this command in channels under the Stock category.',
                ephemeral: true
            });
        }

        const attachment = interaction.options.getAttachment('image');
        
        // Validate image type
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!validTypes.includes(attachment.contentType)) {
            return interaction.reply({ 
                content: 'Please upload a valid image file (jpg, jpeg, png, or webp).', 
                ephemeral: true 
            });
        }
        
        // Create and show modal
        const modal = new ModalBuilder()
            .setCustomId('accountDetailsModal')
            .setTitle('List Account');
        
        const priceInput = new TextInputBuilder()
            .setCustomId('priceInput')
            .setLabel('Price (e.g. Offer)')
            .setPlaceholder('Enter the price or "Offer"')
            .setMaxLength(20)
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const skins = new TextInputBuilder()
            .setCustomId('skins')
            .setLabel('Stock amount')
            .setPlaceholder('1')
            .setMaxLength(10)
            .setStyle(TextInputStyle.Short)
            .setRequired(true);            
            
        const descriptionInput = new TextInputBuilder()
            .setCustomId('descriptionInput')
            .setLabel('Description')
            .setPlaceholder('Describe the account, e.g. "Includes rare skins, max level, etc."')
            .setMaxLength(1000)
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const stw = new TextInputBuilder()
            .setCustomId('stw')
            .setLabel('Type')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(3)
            .setMinLength(2)
            .setPlaceholder('FA/NFA/SFA')
            .setRequired(true);            
            
        modal.addComponents(
            new ActionRowBuilder().addComponents(descriptionInput),
            new ActionRowBuilder().addComponents(priceInput),
            new ActionRowBuilder().addComponents(skins),
            new ActionRowBuilder().addComponents(stw)
        );
        
        await interaction.showModal(modal);
        
        // Handle modal submission
        interaction.awaitModalSubmit({ 
            filter: i => i.customId === 'accountDetailsModal',
            time: 840000 
        }).then(async modalInteraction => {
            const price = modalInteraction.fields.getTextInputValue('priceInput');
            const description = modalInteraction.fields.getTextInputValue('descriptionInput');
            const skinsCount = modalInteraction.fields.getTextInputValue('skins');
            const stwAccess = modalInteraction.fields.getTextInputValue('stw');
            
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('New $t0ck listed')
                .setDescription(`**${description}**`)
                .addFields(
                    { name: '💸 Pr!c3', value: price, inline: true },
                    { name: '🔢 Stock amount', value: skinsCount, inline: true },
                    { name: 'ℹ️ Type', value: stwAccess, inline: true }
                )
                .setFooter({ text: `Made by darespvp\nListed by ${modalInteraction.user.tag}` })
                .setImage(attachment.url)
                .setTimestamp();
            
            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Make 0ff3r')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://discord.com/channels/1389882353006149672/1389882353542893612'),
                    new ButtonBuilder()
                        .setCustomId('markAsSold')
                        .setLabel('Mark as S0ld')
                        .setStyle(ButtonStyle.Danger)
                );
            
            // Send confirmation to the executor (ephemeral)
            await modalInteraction.reply({ 
              content: '✅ Your acc0unt has been listed!',
              ephemeral: true
            });

            // Post the embed and buttons to the channel
            const message = await modalInteraction.channel.send({ 
              embeds: [embed], 
              components: [buttons]
            });
            
            // Store in database
            db.prepare(`
                INSERT INTO account_listings (
                    message_id, channel_id, user_id, 
                    price, description, image_url
                ) VALUES (?, ?, ?, ?, ?, ?)
            `).run(
                message.id,
                message.channelId,
                modalInteraction.user.id,
                price,
                description,
                attachment.url
            );
        }).catch(console.error);
    }
};