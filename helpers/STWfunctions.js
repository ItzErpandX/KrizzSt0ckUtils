// helpers/STWfunctions.js

const { parseTime, formatTime, wait } = require('../helpers/functions');
const activeGames = new Map();

async function runWheel(interaction, participants, title) {
    try {
        const users = [...participants];
        if (users.length === 0) {
            return await interaction.followUp('❌ No participants joined the drop.');
        }

        let currentPlayers = [...users];
        const spinMsg = await interaction.followUp(`🎡 **Spin The Wheel – ${title}**\n\nSpinning in...`);

        while (currentPlayers.length > 1) {
            await countdown(spinMsg, title);
            await eliminatePlayer(currentPlayers, spinMsg, title);
        }

        const winner = currentPlayers[0];
        await interaction.followUp(`🎉 Congratulations <@${winner}>! You won **${title}**! 🎉`);
        activeGames.delete(interaction.channel.id);
    } catch (error) {
        console.error('Wheel error:', error);
        await interaction.followUp('❌ An error occurred during the game.');
    }
}

async function countdown(spinMsg, title) {
    try {
        await spinMsg.edit(`🎡 **Spin The Wheel – ${title}**\n\n3...`);
        await wait(1000);
        await spinMsg.edit(`🎡 **Spin The Wheel – ${title}**\n\n2...`);
        await wait(1000);
        await spinMsg.edit(`🎡 **Spin The Wheel – ${title}**\n\n1...`);
        await wait(1000);
    } catch (error) {
        console.error('Countdown error:', error);
    }
}

async function eliminatePlayer(players, spinMsg, title) {
    try {
        const eliminatedIndex = Math.floor(Math.random() * players.length);
        const eliminated = players.splice(eliminatedIndex, 1)[0];

        await spinMsg.edit(
            `🎡 **Spin The Wheel – ${title}**\n\n` +
            `❌ Eliminated: <@${eliminated}>\n` +
            `🏆 Remaining: ${players.length} player${players.length !== 1 ? 's' : ''}`
        );
        await wait(2000);
    } catch (error) {
        console.error('Elimination error:', error);
    }
}

module.exports = {
    activeGames,
    runWheel,
    countdown,
    eliminatePlayer
};
