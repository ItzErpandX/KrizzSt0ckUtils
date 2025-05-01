require('dotenv').config(); 

module.exports = {
    name: 'rape',
    async handleRape(interaction) {
        const member = interaction.options.getMember('member');

        if (member.user.id == process.env.OWNER_ID) {
            return interaction.reply({ content: '❌ Nice try lil bro but you cant rape my mommy :3' });
        }

        if (member.user.id == 1329914879804571742) {
            return interaction.reply({ content: '❌ Nice try lil bro but you cant rape me :3' });
        }

        return interaction.reply({ content: `✅ Successfully raped <@${member.user.id}>!` });
    }
};
