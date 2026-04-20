module.exports = async function stopradio(interaction, options, client) {
    await interaction.deferReply();

    const player = client.lavalink.players.get(interaction.guildId);

    if (!player) {
        return interaction.editReply({ content: "❌ En soita mitään!" });
    }

    if (!player.isRadio) {
        return interaction.editReply({ content: "❌ Radio ei ole päällä!" });
    }

    player.isRadio = false;
    player.radioStation = null;
    player.radioRetried = false;
    player._resumeRadioStation = null;

    await player.stopPlaying(true, false);
    player.queue.tracks.splice(0);

    return interaction.reply({ content: `⏹️ radio pysäytetty.` });
};