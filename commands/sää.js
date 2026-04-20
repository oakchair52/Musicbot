const { EmbedBuilder } = require("discord.js");
const axios = require("axios");

const weatherCommand = async (interaction) => {
  const city = interaction.options.getString('city');

  
  try {
    const geoApiUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}`;
    const geoResponse = await axios.get(geoApiUrl);
    const geoData = geoResponse.data;

    if (!geoData || !geoData.results || geoData.results.length === 0) {
      throw new Error("e oo tollasta kaupunnia tosijjaa öö");
    }

    const { latitude, longitude } = geoData.results[0];

    //https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,rain,cloud_cover,wind_speed_10m
    const weatherApiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,rain,cloud_cover&timezone=auto&forecast_days=1`;  // Use prefixed URL
    const response = await axios.get(weatherApiUrl);
    const weather = response.data;

    const setColor = () => {
      const temperature = weather.current.temperature_2m;

      if (weather.current.temperature_2m <= 0) {
        return 0x00bfff; // Blue for very cold temperatures
    } else if (weather.current.temperature_2m <= 10) {
        return 0x00FFFF; // Cyan for cold temperatures
    } else if (weather.current.temperature_2m <= 20) {
        return 0x00ff80; // Green for moderate temperatures
    } else if (weather.current.temperature_2m <= 25) {
        return 0xffff00; // Yellow for warm temperatures
    } else {
        return 0xff4000; // Red for hot temperatures
    }
};

const setEmoji = () => {
  const clouds = weather.current.cloud_cover;

  if (clouds <= 10) {
    return "☀️";    // Clear sky
  } else if (clouds <= 25) {
    return "🌤️";    // Mostly sunny
  } else if (clouds <= 50) {
    return "⛅";    // Partly cloudy
  } else if (clouds <= 90) {
    return "🌥️";    // Mostly cloudy
  } else if (clouds <= 100) {
    return "☁️";    // Overcast
  }
};

const setRain = () => {
  const sade = weather.current.rain;

  if (sade <= 0.007) {
    return "";    
  } else if (sade <= 0.15) {
    return "💧";    
  } else if (sade <= 0.23) {
    return "💦";    
  } else if (sade <= 0.78) {
    return "🌧️";    
  }
};

const sattami = setRain();
const cloud = setEmoji();
const color = setColor();

    const saa = new EmbedBuilder ()
        .setColor(color)
        .setTitle(`Weather in ${city} ${cloud} ${sattami}`)
        .setDescription(`The current temperature is ${weather.current.temperature_2m}°C`)

    await interaction.reply({
      embeds: [saa],
    });

  } catch (error) {
    console.error("Error fetching weather data:", error);
    await interaction.reply(
      "e oo tollasta kaupunnia tosijjaa öö"
    );
  }
};

module.exports = weatherCommand;
