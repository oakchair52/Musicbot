const { EmbedBuilder } = require("discord.js");

// ─────────────────────────────────────────────────────────────
// Radio station definitions
// If a stream URL stops working, update it here.
// You can find stream URLs by:
//   1. Opening the station's website and inspecting Network tab while it plays
//   2. Searching "<station name> stream URL" on radio-browser.info
// ─────────────────────────────────────────────────────────────
const STATIONS = {
    jarviradio: {
        name: "Järviradio",
        url: "http://stream.jarviradio.fi/radio/8000/stream",
        emoji: "📻",
        color: "#1e90ff",
        thumbnail: "https://jarviradio.fi/player/img/jarviradio_player_logo.png",
    },
    sandelsradio: {
        name: "Sandels Radio",
        url: "http://stream.sandelsradio.fi/radio/8000/stream",
        emoji: "🎙️",
        color: "#ff6600",
        thumbnail: null,
    },
    uptempo: {
        name: "UpTempo",
        url: "http://shoutcast1.hardcoreradio.nl/",
        emoji: "🤘",
        color: "#ff0000",
        thumbnail: "https://cdn-radiotime-logos.tunein.com/s7869d.png",
    },
};

// How long to wait before retrying after a stream error/end (ms)
const RETRY_DELAY = 5000;

// ─────────────────────────────────────────────────────────────
// Internal helper — search & play a station on an existing player.
// Returns true on success, false on failure.
// ─────────────────────────────────────────────────────────────
async function playRadioStream(player, station, requester, client) {
    // Use stored requester as fallback (e.g. during retries)
    const user = requester || player._radioRequester || null;

    const result = await player.search(
        { query: station.url, source: "http" },
        user
    );
//console.log("[radio] loadType:", result?.loadType, "tracks:", result?.tracks?.length);
//console.log("[radio] full result:", JSON.stringify(result, null, 2));
    if (!result || result.loadType === "error" || result.loadType === "empty" || !result.tracks[0]) {
        return false;
    }

    await player.play({ track: result.tracks[0] });
    player.isRadio = true;
    player.radioStation = Object.keys(STATIONS).find(k => STATIONS[k] === station);
    player.radioRetried = false; // reset retry flag on successful play
    return true;
    
}

// ─────────────────────────────────────────────────────────────
// Register Lavalink listeners for radio retry & disconnect logic.
// Called once per client, guarded by a flag so it doesn't double-register.
// ─────────────────────────────────────────────────────────────
function registerRadioListeners(client) {
    if (client._radioListenersRegistered) return;
    client._radioListenersRegistered = true;

    // Fired when a track ends (includes stream drops)
    client.lavalink.on("trackEnd", async (player, track, reason) => {
        if (!player.isRadio || !player.radioStation) return;

        // "replaced" means we intentionally stopped it (e.g. /skip, new /radio call) — don't retry
        if (reason === "replaced" || reason === "stopped") return;

        const station = STATIONS[player.radioStation];
        if (!station) return;

        const textChannel = client.channels.cache.get(player.textChannelId);

        if (player.radioRetried) {
            // Already retried once — give up and leave
            console.log(`[radio] Stream failed twice for ${station.name} in ${player.guildId}, disconnecting.`);
            if (textChannel) {
                textChannel.send(`📻 **${station.name}** yhteys katkeili liikaa — lähdettiin kanavalta.`).catch(() => {});
            }
            player.isRadio = false;
            player.radioStation = null;
            player.radioRetried = false;
            await player.destroy();
            return;
        }

        // First failure — retry after a short delay
        console.log(`[radio] Stream ended unexpectedly for ${station.name}, retrying in ${RETRY_DELAY / 1000}s...`);
        if (textChannel) {
            textChannel.send(`📻 **${station.name}** yhteys katkesi, yritetään uudelleen ${RETRY_DELAY / 1000} sekunnin kuluttua...`).catch(() => {});
        }

        player.radioRetried = true;

        setTimeout(async () => {
            // Make sure player still exists and is still in radio mode
            const p = client.lavalink.players.get(player.guildId);
            if (!p || !p.isRadio || p.radioStation !== player.radioStation) return;

            const success = await playRadioStream(p, station, null, client);
            if (!success) {
                console.log(`[radio] Retry failed for ${station.name} in ${p.guildId}, disconnecting.`);
                if (textChannel) {
                    textChannel.send(`📻 **${station.name}** uudelleenyritys epäonnistui — lähdettiin kanavalta.`).catch(() => {});
                }
                p.isRadio = false;
                p.radioStation = null;
                p.radioRetried = false;
                await p.destroy();
            } else {
                if (textChannel) {
                    textChannel.send(`✅ **${station.name}** yhteys palautettu!`).catch(() => {});
                }
            }
        }, RETRY_DELAY);
    });

    // Also retry on trackError (Lavalink-level stream error)
    client.lavalink.on("trackError", async (player, track, error) => {
        if (!player.isRadio || !player.radioStation) return;

        const station = STATIONS[player.radioStation];
        if (!station) return;

        console.error(`[radio] trackError for ${station.name}:`, error);
        // trackError is followed by a trackEnd event, so retry logic fires there.
        // Nothing extra needed here — just log it.
    });
}

async function radio(interaction, options, client) {
    await interaction.deferReply();

    // Register retry listeners the first time any /radio is used
    registerRadioListeners(client);

    const stationKey = options.getString("station");
    const station = STATIONS[stationKey];

    if (!station) {
        return interaction.editReply({ content: "❌ Tuntematon radiokanava!", ephemeral: true });
    }

    // Must be in a voice channel
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
        return interaction.editReply({
            content: "❌ Liity ensin voice-kanavalle!",
            ephemeral: true,
        });
    }

    // Check bot permissions
    const permissions = voiceChannel.permissionsFor(interaction.guild.members.me);
    if (!permissions.has("Connect") || !permissions.has("Speak")) {
        return interaction.editReply({
            content: "❌ Minulla ei ole oikeuksia liittyä tai puhua kanavallasi!",
            ephemeral: true,
        });
    }

    try {
        // Get or create a Lavalink player
        let player = client.lavalink.players.get(interaction.guildId);

        if (!player) {
            player = await client.lavalink.createPlayer({
                guildId: interaction.guildId,
                voiceChannelId: voiceChannel.id,
                textChannelId: interaction.channelId,
                selfDeaf: true,
                selfMute: false,
            });
        } else {
            // Move to user's channel if needed
            if (player.voiceChannelId !== voiceChannel.id) {
                await player.setVoiceChannel(voiceChannel.id);
            }
            // Update text channel so retry messages go to the right place
            player.textChannelId = interaction.channelId;
        }

        // Connect to voice if not already connected
        if (!player.connected) {
            await player.connect();
        }

        // Stop whatever is currently playing (music or previous radio) — reason = "replaced"
        await player.stopPlaying(true, false);
        player.queue.tracks.splice(0);

        // Reset radio state before starting fresh
        player.isRadio = false;
        player.radioStation = null;
        player.radioRetried = false;

        // Load and play the stream
        player._radioRequester = interaction.user;
        const success = await playRadioStream(player, station, interaction.user, client);

        if (!success) {
            return interaction.editReply({
                content: `❌ ${station.name}:n lataaminen epäonnistui (**${station.name}**). Tarkista stream URL.`,
            });
        }

        const embed = new EmbedBuilder()
            .setColor(station.color)
            .setTitle(`${station.emoji} Radio käynnissä`)
            .setDescription(`Kuunnellaan **${station.name}** 🎶`)
            .addFields({ name: "Kanava", value: voiceChannel.name, inline: true })
            .setFooter({ text: "Pysäytä radio komennolla /stop tai /skip" })
            .setTimestamp();

        if (station.thumbnail) {
            embed.setThumbnail(station.thumbnail);
        }

        return interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error("[radio] Error:", error);
        return interaction.editReply({
            content: `❌ Virhe radion käynnistämisessä: ${error.message}`,
        });
    }
    
};
module.exports = radio;
module.exports.resumeRadio = async function(player, stationKey, client) {
    const station = STATIONS[stationKey];
    if (!station) return;
    player.isRadio = false;
    player.radioStation = null;
    player.radioRetried = false;
    await playRadioStream(player, station, player._radioRequester, client);
};