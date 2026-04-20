
/*const { Collection } = require('discord.js');

// Constants
const GAME_NAME = "League of Legends";
const TIME_LIMIT = 10 * 60 * 1000; // 10 minutes in milliseconds

// A collection to keep track of users playing League of Legends
const userLeagueTimers = new Collection();

// Ban functionality toggle state
let banEnabled = true; // Default to true (enabled)

// Function to toggle the ban system
const toggleBan = async (interaction, status) => {
    banEnabled = status;
    await interaction.reply(`Ban system is now ${banEnabled ? "enabled" : "disabled"}.`);
};

// Function to handle the ban logic
const banCommand = async (newPresence, client) => {
    if (!banEnabled) return; // Exit if the ban system is disabled

    const member = newPresence.member;

    // Check if the member is playing League of Legends
    const game = newPresence.activities.find(activity => activity.name === GAME_NAME);

    const generalChannel = client.channels.cache.find(ch => ch.name === 'general');

    if (game) {
        // If the user starts playing League of Legends
        if (!userLeagueTimers.has(member.id)) {
            console.log(`${member.user.tag} started playing ${GAME_NAME}`);

            // Send a warning message to the user
            try {
                await member.send(`⚠️ **Warning!** You are playing ${GAME_NAME}. You have 10 minutes before you will be banned.`);
                generalChannel.send(`🚨 **Attention!** ${member.user.tag} has started playing ${GAME_NAME}. They will be monitored for 10 minutes.`);
            } catch (error) {
                console.error(`Failed to send warning to ${member.user.tag}:`, error);
            }
            if (generalChannel) {
                generalChannel.send(`🚨 **Attention!** ${member.user.tag} has started playing ${GAME_NAME}. They will be monitored for 10 minutes.`);
            } else {
                console.warn("General channel not found. Please make sure there is a 'general' text channel in the server.");
            }

            // Track the user and set a timer to ban them if they continue playing after 10 minutes
            userLeagueTimers.set(member.id, Date.now());

            setTimeout(async () => {
                const startTime = userLeagueTimers.get(member.id);
                // If the user is still playing after 10 minutes, proceed with banning
                if (startTime && Date.now() - startTime >= TIME_LIMIT) {
                    const stillPlaying = member.presence?.activities.find(activity => activity.name === GAME_NAME);
                    if (stillPlaying) {
                        try {
                            await member.ban({ reason: `Played ${GAME_NAME} for more than 10 minutes.` });
                            console.log(`${member.user.tag} was banned for playing ${GAME_NAME} for too long.`);
                        } catch (error) {
                            console.error(`Failed to ban ${member.user.tag}:`, error);
                        }
                    }
                }
                // Remove user from tracking map
                userLeagueTimers.delete(member.id);
            }, TIME_LIMIT);
        }
    } else {
        // If the user stopped playing the game, remove them from tracking
        if (userLeagueTimers.has(member.id)) {
            console.log(`${member.user.tag} stopped playing ${GAME_NAME}`);
            userLeagueTimers.delete(member.id);
        }
    }
};

module.exports = {
    banCommand,
    toggleBan,
};
*/
