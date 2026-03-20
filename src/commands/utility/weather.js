import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, errorEmbed } from '../../utils/embed.js';

const WEATHER_ICONS = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️',
  80: '🌦️', 81: '🌧️', 82: '⛈️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

const WEATHER_DESC = {
  0: 'Açık', 1: 'Çoğunlukla açık', 2: 'Parçalı bulutlu', 3: 'Bulutlu',
  45: 'Sisli', 48: 'Yoğun sisli',
  51: 'Hafif çiseleyen', 53: 'Orta çiseleyen', 55: 'Yoğun çiseleyen',
  61: 'Hafif yağmurlu', 63: 'Orta yağmurlu', 65: 'Şiddetli yağmurlu',
  71: 'Hafif karlı', 73: 'Orta karlı', 75: 'Yoğun karlı',
  80: 'Hafif sağanak', 81: 'Orta sağanak', 82: 'Şiddetli sağanak',
  95: 'Gök gürültülü', 96: 'Dolu ile gök gürültülü', 99: 'Şiddetli dolu',
};

export default {
  category: '🔧 Araçlar',
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('weather')
    .setDescription('Hava durumu bilgisi')
    .addStringOption(o => o.setName('sehir').setDescription('Şehir adı').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();

    const city = interaction.options.getString('sehir');

    try {
      // Geocoding — şehir adını koordinata çevir
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=tr&format=json`
      );
      const geoData = await geoRes.json();

      if (!geoData.results?.length) {
        return interaction.editReply({ embeds: [errorEmbed(`"${city}" şehri bulunamadı.`)] });
      }

      const { latitude, longitude, name, country } = geoData.results[0];

      // Hava durumu verisi
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature&timezone=auto`
      );
      const weatherData = await weatherRes.json();
      const cur = weatherData.current;

      const code = cur.weather_code;
      const icon = WEATHER_ICONS[code] ?? '🌡️';
      const desc = WEATHER_DESC[code] ?? 'Bilinmiyor';

      await interaction.editReply({
        embeds: [createEmbed({
          type: 'info',
          title: `${icon} ${name}, ${country}`,
          fields: [
            { name: '🌡️ Sıcaklık', value: `${cur.temperature_2m}°C (Hissedilen: ${cur.apparent_temperature}°C)`, inline: true },
            { name: '💧 Nem', value: `%${cur.relative_humidity_2m}`, inline: true },
            { name: '💨 Rüzgar', value: `${cur.wind_speed_10m} km/s`, inline: true },
            { name: '☁️ Durum', value: desc, inline: true },
          ],
          footer: 'Open-Meteo API • Ücretsiz & kayıt gerektirmez',
        })],
      });
    } catch (err) {
      await interaction.editReply({ embeds: [errorEmbed(`Hava durumu alınamadı: ${err.message}`)] });
    }
  },
};
