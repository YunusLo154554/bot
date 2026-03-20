import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, errorEmbed, successEmbed } from '../../utils/embed.js';

const WORDS = [
  { word: 'elma', hint: 'Bir meyve' },
  { word: 'köpek', hint: 'Evcil hayvan' },
  { word: 'güneş', hint: 'Gökyüzünde parlayan' },
  { word: 'kitap', hint: 'Okuma aracı' },
  { word: 'araba', hint: 'Kara taşıtı' },
  { word: 'deniz', hint: 'Büyük su kütlesi' },
  { word: 'müzik', hint: 'Kulakla algılanan sanat' },
  { word: 'bilgisayar', hint: 'Elektronik cihaz' },
  { word: 'çiçek', hint: 'Bitkinin renkli kısmı' },
  { word: 'yıldız', hint: 'Geceleri parlayan' },
];

// userId -> { word, hint, attempts, guesses }
const games = new Map();

export default {
  category: '🎮 Eğlence',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('wordguess')
    .setDescription('Kelime tahmin oyunu')
    .addStringOption(o =>
      o.setName('tahmin').setDescription('Kelime tahminin').setRequired(false)
    ),

  async execute(interaction) {
    const guess = interaction.options.getString('tahmin')?.toLowerCase().trim();

    // Yeni oyun
    if (!games.has(interaction.user.id) || !guess) {
      const entry = WORDS[Math.floor(Math.random() * WORDS.length)];
      games.set(interaction.user.id, { word: entry.word, hint: entry.hint, attempts: 6, guesses: [] });

      return interaction.reply({
        embeds: [buildEmbed(games.get(interaction.user.id))],
      });
    }

    const game = games.get(interaction.user.id);

    if (game.guesses.includes(guess)) {
      return interaction.reply({ embeds: [errorEmbed(`**${guess}** zaten denedin.`)], ephemeral: true });
    }

    game.guesses.push(guess);

    if (guess === game.word) {
      games.delete(interaction.user.id);
      return interaction.reply({
        embeds: [successEmbed(`Doğru! Kelime **${game.word}** idi. 🎉`, '✅ Kazandın!')],
      });
    }

    game.attempts--;

    if (game.attempts <= 0) {
      games.delete(interaction.user.id);
      return interaction.reply({
        embeds: [createEmbed({ type: 'error', title: '💀 Kaybettin!', description: `Kelime **${game.word}** idi.` })],
      });
    }

    await interaction.reply({ embeds: [buildEmbed(game)] });
  },
};

function buildEmbed(game) {
  const masked = game.word.split('').map((c, i) => {
    if (i === 0 || i === game.word.length - 1) return c;
    return game.guesses.some(g => g === game.word) ? c : '_';
  }).join(' ');

  return createEmbed({
    type: 'info',
    title: '🔤 Kelime Tahmin',
    fields: [
      { name: '💡 İpucu', value: game.hint, inline: true },
      { name: '❤️ Kalan Hak', value: `${game.attempts}`, inline: true },
      { name: '📝 Kelime', value: `\`${masked}\` (${game.word.length} harf)`, inline: false },
      { name: '🔍 Denemeler', value: game.guesses.join(', ') || 'Henüz yok', inline: false },
    ],
    footer: '/wordguess tahmin:kelime ile tahmin et',
  });
}
