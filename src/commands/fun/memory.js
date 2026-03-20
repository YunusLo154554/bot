import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { createEmbed, errorEmbed, successEmbed } from '../../utils/embed.js';

const EMOJIS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝', '🍑'];

// userId -> { board, flipped, matched, moves, startTime }
const games = new Map();

function buildBoard() {
  const pairs = [...EMOJIS, ...EMOJIS].sort(() => Math.random() - 0.5);
  return pairs.map((emoji, i) => ({ emoji, id: i, revealed: false, matched: false }));
}

function buildComponents(board, disabled = false) {
  const rows = [];
  for (let r = 0; r < 4; r++) {
    const row = new ActionRowBuilder();
    for (let c = 0; c < 4; c++) {
      const cell = board[r * 4 + c];
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`mem_${cell.id}`)
          .setLabel(cell.revealed || cell.matched ? cell.emoji : '❓')
          .setStyle(cell.matched ? ButtonStyle.Success : cell.revealed ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(disabled || cell.matched || cell.revealed)
      );
    }
    rows.push(row);
  }
  return rows;
}

export default {
  category: '🎮 Eğlence',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('memory')
    .setDescription('Hafıza oyunu — eşleşen kartları bul'),

  async execute(interaction) {
    if (games.has(interaction.user.id)) {
      return interaction.reply({ embeds: [errorEmbed('Zaten aktif bir oyunun var.')], ephemeral: true });
    }

    const board = buildBoard();
    games.set(interaction.user.id, { board, flipped: [], matched: 0, moves: 0, startTime: Date.now() });

    const msg = await interaction.reply({
      embeds: [createEmbed({
        type: 'info',
        title: '🧠 Hafıza Oyunu',
        description: 'Eşleşen kartları bul! İki kart seç.',
        fields: [{ name: '🎯 Eşleşme', value: '0/8', inline: true }, { name: '🔄 Hamle', value: '0', inline: true }],
      })],
      components: buildComponents(board),
      fetchReply: true,
    });

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id && i.customId.startsWith('mem_'),
      time: 300_000,
    });

    collector.on('collect', async i => {
      const game = games.get(i.user.id);
      if (!game) return collector.stop();

      const idx = parseInt(i.customId.split('_')[1]);
      const cell = game.board[idx];

      cell.revealed = true;
      game.flipped.push(idx);

      if (game.flipped.length === 2) {
        game.moves++;
        const [a, b] = game.flipped;
        const cellA = game.board[a];
        const cellB = game.board[b];

        if (cellA.emoji === cellB.emoji) {
          cellA.matched = true;
          cellB.matched = true;
          game.matched++;
          game.flipped = [];

          if (game.matched === 8) {
            const elapsed = Math.floor((Date.now() - game.startTime) / 1000);
            games.delete(i.user.id);
            collector.stop();
            return i.update({
              embeds: [successEmbed(`Tüm eşleşmeleri buldun! 🎉\n⏱️ Süre: **${elapsed}sn** | 🔄 Hamle: **${game.moves}**`, '🏆 Kazandın!')],
              components: buildComponents(game.board, true),
            });
          }
        } else {
          // 1 saniye sonra kapat
          await i.update({
            embeds: [createEmbed({
              type: 'info',
              title: '🧠 Hafıza Oyunu',
              description: 'Eşleşme yok! Kartlar kapanıyor...',
              fields: [{ name: '🎯 Eşleşme', value: `${game.matched}/8`, inline: true }, { name: '🔄 Hamle', value: `${game.moves}`, inline: true }],
            })],
            components: buildComponents(game.board, true),
          });

          await new Promise(r => setTimeout(r, 1000));
          cellA.revealed = false;
          cellB.revealed = false;
          game.flipped = [];

          return i.editReply({
            embeds: [createEmbed({
              type: 'info',
              title: '🧠 Hafıza Oyunu',
              description: 'İki kart seç.',
              fields: [{ name: '🎯 Eşleşme', value: `${game.matched}/8`, inline: true }, { name: '🔄 Hamle', value: `${game.moves}`, inline: true }],
            })],
            components: buildComponents(game.board),
          });
        }
      }

      await i.update({
        embeds: [createEmbed({
          type: 'info',
          title: '🧠 Hafıza Oyunu',
          description: game.flipped.length === 1 ? 'Bir kart daha seç.' : 'İki kart seç.',
          fields: [{ name: '🎯 Eşleşme', value: `${game.matched}/8`, inline: true }, { name: '🔄 Hamle', value: `${game.moves}`, inline: true }],
        })],
        components: buildComponents(game.board),
      });
    });

    collector.on('end', (_, reason) => {
      if (reason === 'time') games.delete(interaction.user.id);
    });
  },
};
