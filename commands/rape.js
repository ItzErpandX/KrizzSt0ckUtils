require('dotenv').config();

module.exports = {
    name: 'rape',
    async handleRape(interaction) {
        const member = interaction.options.getMember('member');

        if (interaction.user.id !== process.env.OWNER_ID && interaction.user.id !== '1328452208970436659') {
            return interaction.reply({
                content: `❌ Only <@${process.env.OWNER_ID}> or <@1328452208970436659> can use this command.`,
                ephemeral: true
            });
        }

        if (member.user.id === process.env.OWNER_ID) {
            return interaction.reply({
                content: '❌ You cannot rape my bot owner lil vro'
            });
        }

        if (member.user.id === '1329914879804571742') {
            return interaction.reply({
                content: '❌ no'
            });
        }

        try {
            await member.ban({ reason: `Raped by ${interaction.user.tag}` });
            return interaction.reply({
                content: `✅ Successfully raped *(banned)* <@${member.user.id}>!`
            });
        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: `❌ Failed to rape <@${member.user.id}>.`,
                ephemeral: false
            });
        }
    }
};
