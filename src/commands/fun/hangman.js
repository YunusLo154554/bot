import { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { createEmbed, errorEmbed, successEmbed } from '../../utils/embed.js';

const WORDS = [
  'elma', 'bilgisayar', 'discord', 'sunucu', 'moderasyon', 'komut', 'yazılım',
  'klavye', 'ekran', 'internet', 'program', 'oyun', 'müzik', 'kitap', 'araba',
  'uçak', 'deniz', 'dağ', 'orman', 'şehir', 'ülke', 'dünya', 'güneş', 'ay',
];

const STAGES = [
  '```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========```',
];

// userId -> { word, guessed, wrong, msgId }
const games = new Map();

export default {
  category: '🎮 Eğlence',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('hangman')
    .setDescription('Adam asmaca oyunu')
    .addStringOption(o => o.setName('harf').setDescription('Tahmin etmek istediğin harf').setRequired(false).setMaxLength(1)),

  async execute(interaction) {
    const guess = interaction.options.getString('harf')?.toLowerCase();

    // Yeni oyun başlat
    if (!games.has(interaction.user.id) || !guess) {
      const word = WORDS[Math.floor(Math.random() * WORDS.length)];
      games.set(interaction.user.id, { word, guessed: new Set(), wrong: [] });

      const game = games.get(interaction.user.id);
      return interaction.reply({
        embeds: [buildEmbed(game)],
      });
    }

    const game = games.get(interaction.user.id);

    if (game.guessed.has(guess) || game.wrong.includes(guess)) {
      return interaction.reply({ embeds: [errorEmbed(`**${guess}** harfini zaten denedin.`)], ephemeral: true });
    }

    if (!/^[a-züğışöç]$/i.test(guess)) {
      return interaction.reply({ embeds: [errorEmbed('Sadece tek bir harf gir.')], ephemeral: true });
    }

    if (game.word.includes(guess)) {
      game.guessed.add(guess);
    } else {
      game.wrong.push(guess);
    }

    const display = game.word.split('').map(c => game.guessed.has(c) ? c : '_').join(' ');
    const won = !display.includes('_');
    const lost = game.wrong.length >= 6;

    if (won || lost) {
      games.delete(interaction.user.id);
      return interaction.reply({
        embeds: [createEmbed({
          type: won ? 'success' : 'error',
          title: won ? '🎉 Kazandın!' : '💀 Kaybettin!',
          description: `Kelime: **${game.word}**\n${STAGES[game.wrong.length]}\nYanlış harfler: ${game.wrong.join(', ') || 'yok'}`,
        })],
      });
    }

    await interaction.reply({ embeds: [buildEmbed(game)] });
  },
};

function buildEmbed(game) {
  const display = game.word.split('').map(c => game.guessed.has(c) ? c.toUpperCase() : '\\_').join(' ');
  return createEmbed({
    type: 'info',
    title: '🪢 Adam Asmaca',
    description: STAGES[game.wrong.length],
    fields: [
      { name: '📝 Kelime', value: `\`${display}\``, inline: false },
      { name: '❌ Yanlış Harfler', value: game.wrong.length ? game.wrong.join(', ') : 'Henüz yok', inline: true },
      { name: '💡 Kalan Hak', value: `${6 - game.wrong.length}`, inline: true },
    ],
    footer: '/hangman harf:X ile tahmin et',
  });
}
