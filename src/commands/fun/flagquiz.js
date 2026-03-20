import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { createEmbed } from '../../utils/embed.js';

const FLAGS = [
  { country: 'Türkiye', emoji: '🇹🇷' },
  { country: 'Almanya', emoji: '🇩🇪' },
  { country: 'Fransa', emoji: '🇫🇷' },
  { country: 'İtalya', emoji: '🇮🇹' },
  { country: 'İspanya', emoji: '🇪🇸' },
  { country: 'Japonya', emoji: '🇯🇵' },
  { country: 'Brezilya', emoji: '🇧🇷' },
  { country: 'Kanada', emoji: '🇨🇦' },
  { country: 'Avustralya', emoji: '🇦🇺' },
  { country: 'Hindistan', emoji: '🇮🇳' },
  { country: 'Meksika', emoji: '🇲🇽' },
  { country: 'Arjantin', emoji: '🇦🇷' },
  { country: 'Güney Kore', emoji: '🇰🇷' },
  { country: 'Portekiz', emoji: '🇵🇹' },
  { country: 'Hollanda', emoji: '🇳🇱' },
  { country: 'İsveç', emoji: '🇸🇪' },
  { country: 'Norveç', emoji: '🇳🇴' },
  { country: 'Polonya', emoji: '🇵🇱' },
  { country: 'Yunanistan', emoji: '🇬🇷' },
  { country: 'Mısır', emoji: '🇪🇬' },
];

const active = new Map();

export default {
  category: '🎮 Eğlence',
  cooldown: 8,
  data: new SlashCommandBuilder()
    .setName('flagquiz')
    .setDescription('Bayrak bilmece oyunu'),

  async execute(interaction) {
    if (active.has(interaction.user.id)) {
      return interaction.reply({ content: 'Zaten aktif bir sorun var!', ephemeral: true });
    }

    const shuffled = [...FLAGS].sort(() => Math.random() - 0.5);
    const correct = shuffled[0];
    const options = shuffled.slice(0, 4).sort(() => Math.random() - 0.5);

    const row = new ActionRowBuilder().addComponents(
      options.map((f, i) =>
        new ButtonBuilder()
          .setCustomId(`fq_${i}`)
          .setLabel(f.country)
          .setStyle(ButtonStyle.Secondary)
      )
    );

    active.set(interaction.user.id, true);

    const msg = await interaction.reply({
      embeds: [createEmbed({
        type: 'info',
        title: '🌍 Bayrak Bilmece',
        description: `# ${correct.emoji}\n\nBu hangi ülkenin bayrağı?`,
        footer: '20 saniye içinde cevapla!',
      })],
      components: [row],
      fetchReply: true,
    });

    const timeout = setTimeout(() => {
      active.delete(interaction.user.id);
      msg.edit({
        embeds: [createEmbed({ type: 'error', title: '⏰ Süre Doldu!', description: `Cevap: **${correct.emoji} ${correct.country}**` })],
        components: [],
      }).catch(() => null);
    }, 20_000);

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id && i.customId.startsWith('fq_'),
      time: 20_000,
      max: 1,
    });

    collector.on('collect', async i => {
      clearTimeout(timeout);
      active.delete(interaction.user.id);
      const chosen = options[parseInt(i.customId.split('_')[1])];
      const isCorrect = chosen.country === correct.country;

      await i.update({
        embeds: [createEmbed({
          type: isCorrect ? 'success' : 'error',
          title: isCorrect ? `✅ Doğru! ${correct.emoji}` : '❌ Yanlış!',
          description: isCorrect
            ? `Bu **${correct.country}** bayrağı! 🎉`
            : `Seçtiğin: **${chosen.country}**\nDoğru cevap: **${correct.emoji} ${correct.country}**`,
        })],
        components: [],
      });
    });
  },
};
