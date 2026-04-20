const { EmbedBuilder } = require('discord.js');

module.exports = async (interaction, options, client) => {
    const player = client.lavalink.players.get(interaction.guild.id);

    if (!player) {
        return interaction.reply({ content: "❌ Ei mitään soi tällä hetkellä.", ephemeral: true });
    }

    if (!player.playing && !player.paused) {
        return interaction.reply({ content: "❌ Ei mitään soi just nyt.", ephemeral: true });
    }

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel || voiceChannel.id !== player.voiceChannelId) {
        return interaction.reply({ content: "❌ Sinun täytyy olla samassa äänikanavalla ku bot!", ephemeral: true });
    }

    // If queue is empty after current song
    if (player.queue.tracks.length === 0) {
        // Resume radio if one was playing before
        if (player._resumeRadioStation) {
            const stationKey = player._resumeRadioStation;
            player._resumeRadioStation = null;

            await player.stopPlaying(true, false);

            const radioCommand = require("./radio");
            await radioCommand.resumeRadio(player, stationKey, client);

            return interaction.reply(`📻 Jono loppui! Jatketaan radiota...`);
        }

        await player.destroy();
        return interaction.reply("⏹️ Ei enempää biisejä jonossa – lopetin soiton ja lähdin kanavalta.");
    }

    try {
        const currentTrack = player.queue.current;
        await player.skip();

        const embed = new EmbedBuilder()
            .setColor("#ff9900")
            .setTitle("⏭️ Biisi skipattu!")
            .setDescription(`**${currentTrack.info.title}** ohitettu.`)
            .setFooter({ text: `Skipattu käyttäjän ${interaction.user.username} toimesta` });

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error("Skip command error:", error);
        await interaction.reply({ content: "❌ Jotain meni vikaan skippauksessa. Kokeile uudestaan!", ephemeral: true });
    }
};