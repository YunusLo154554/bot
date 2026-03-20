import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, errorEmbed } from '../../utils/embed.js';

const LANG_NAMES = {
  tr: 'Türkçe', en: 'İngilizce', de: 'Almanca', fr: 'Fransızca',
  es: 'İspanyolca', it: 'İtalyanca', ru: 'Rusça', ja: 'Japonca',
  ko: 'Korece', ar: 'Arapça', zh: 'Çince', pt: 'Portekizce',
};

export default {
  category: '🔧 Araçlar',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Metin çevirisi yap')
    .addStringOption(o => o.setName('metin').setDescription('Çevrilecek metin').setRequired(true).setMaxLength(500))
    .addStringOption(o =>
      o.setName('hedef').setDescription('Hedef dil').setRequired(true)
        .addChoices(
          { name: 'Türkçe', value: 'tr' },
          { name: 'İngilizce', value: 'en' },
          { name: 'Almanca', value: 'de' },
          { name: 'Fransızca', value: 'fr' },
          { name: 'İspanyolca', value: 'es' },
          { name: 'Japonca', value: 'ja' },
          { name: 'Rusça', value: 'ru' },
          { name: 'Arapça', value: 'ar' },
        )
    )
    .addStringOption(o =>
      o.setName('kaynak').setDescription('Kaynak dil (varsayılan: otomatik)').setRequired(false)
        .addChoices(
          { name: 'Otomatik', value: 'auto' },
          { name: 'Türkçe', value: 'tr' },
          { name: 'İngilizce', value: 'en' },
          { name: 'Almanca', value: 'de' },
          { name: 'Fransızca', value: 'fr' },
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const text = interaction.options.getString('metin');
    const target = interaction.options.getString('hedef');
    const source = interaction.options.getString('kaynak') ?? 'auto';

    try {
      // MyMemory ücretsiz çeviri API'si — kayıt gerektirmez
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source === 'auto' ? 'autodetect' : source}|${target}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.responseStatus !== 200) throw new Error(data.responseDetails);

      const translated = data.responseData.translatedText;
      const detectedLang = data.responseData.detectedLanguage ?? source;

      await interaction.editReply({
        embeds: [createEmbed({
          type: 'info',
          title: '🌐 Çeviri',
          fields: [
            { name: `📥 Kaynak (${LANG_NAMES[detectedLang] ?? detectedLang})`, value: text, inline: false },
            { name: `📤 Çeviri (${LANG_NAMES[target] ?? target})`, value: translated, inline: false },
          ],
          footer: 'MyMemory Translation API',
        })],
      });
    } catch (err) {
      await interaction.editReply({ embeds: [errorEmbed(`Çeviri yapılamadı: ${err.message}`)] });
    }
  },
};
