import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, errorEmbed } from '../../utils/embed.js';

export default {
  category: '🔧 Araçlar',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('qr')
    .setDescription('QR kod oluştur')
    .addStringOption(o => o.setName('metin').setDescription('QR koda dönüştürülecek metin veya URL').setRequired(true).setMaxLength(300)),

  async execute(interaction) {
    const text = interaction.options.getString('metin');
    // qrserver.com — ücretsiz, kayıt gerektirmez
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;

    await interaction.reply({
      embeds: [createEmbed({
        type: 'info',
        title: '📱 QR Kod',
        description: `\`${text.slice(0, 100)}${text.length > 100 ? '...' : ''}\``,
        thumbnail: qrUrl,
        footer: 'QR Server API',
      })],
    });
  },
};
