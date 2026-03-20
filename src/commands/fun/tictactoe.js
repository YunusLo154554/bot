import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { createEmbed, errorEmbed, warnEmbed } from '../../utils/embed.js';

// gameId -> { board, players, turn, msgId }
const games = new Map();

function makeBoard() { return Array(9).fill(null); }

function checkWin(b) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,b2,c] of lines) if (b[a] && b[a] === b[b2] && b[a] === b[c]) return b[a];
  return null;
}

function buildComponents(board, disabled = false) {
  const rows = [];
  for (let r = 0; r < 3; r++) {
    const row = new ActionRowBuilder();
    for (let c = 0; c < 3; c++) {
      const i = r * 3 + c;
      const val = board[i];
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`ttt_${i}`)
          .setLabel(val ?? '·')
          .setStyle(val === 'X' ? ButtonStyle.Danger : val === 'O' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(disabled || !!val),
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
    .setName('tictactoe')
    .setDescription('XOX oyunu başlat')
    .addUserOption(o => o.setName('rakip').setDescription('Rakip kullanıcı').setRequired(true)),

  async execute(interaction) {
    const opponent = interaction.options.getUser('rakip');
    if (opponent.id === interaction.user.id) return interaction.reply({ embeds: [errorEmbed('Kendinle oynayamazsın.')], ephemeral: true });
    if (opponent.bot) return interaction.reply({ embeds: [errorEmbed('Botla oynayamazsın.')], ephemeral: true });

    const gameId = `${interaction.user.id}-${opponent.id}`;
    if (games.has(gameId)) return interaction.reply({ embeds: [errorEmbed('Bu kullanıcıyla zaten aktif bir oyun var.')], ephemeral: true });

    const board = makeBoard();
    games.set(gameId, { board, players: [interaction.user.id, opponent.id], turn: 0 });

    const msg = await interaction.reply({
      embeds: [createEmbed({
        type: 'info',
        title: '❌⭕ XOX Oyunu',
        description: `${interaction.user} (**X**) vs ${opponent} (**O**)\n\nSıra: ${interaction.user} (**X**)`,
      })],
      components: buildComponents(board),
      fetchReply: true,
    });

    const collector = msg.createMessageComponentCollector({
      filter: i => [interaction.user.id, opponent.id].includes(i.user.id) && i.customId.startsWith('ttt_'),
      time: 120_000,
    });

    collector.on('collect', async i => {
      const game = games.get(gameId);
      if (!game) return;

      const currentPlayer = game.players[game.turn];
      if (i.user.id !== currentPlayer) {
        return i.reply({ embeds: [warnEmbed('Sıra sende değil.')], ephemeral: true });
      }

      const idx = parseInt(i.customId.split('_')[1]);
      if (game.board[idx]) return i.reply({ embeds: [warnEmbed('Bu kare dolu.')], ephemeral: true });

      game.board[idx] = game.turn === 0 ? 'X' : 'O';
      const winner = checkWin(game.board);
      const full = game.board.every(Boolean);

      if (winner || full) {
        games.delete(gameId);
        collector.stop();
        const winUser = winner ? (winner === 'X' ? interaction.user : opponent) : null;
        return i.update({
          embeds: [createEmbed({
            type: winner ? 'success' : 'warning',
            title: winner ? `🏆 ${winUser?.username} Kazandı!` : '🤝 Berabere!',
            description: winner ? `**${winner}** kazandı!` : 'Tahta doldu, berabere!',
          })],
          components: buildComponents(game.board, true),
        });
      }

      game.turn = 1 - game.turn;
      const nextUser = game.turn === 0 ? interaction.user : opponent;
      const symbol = game.turn === 0 ? 'X' : 'O';

      await i.update({
        embeds: [createEmbed({
          type: 'info',
          title: '❌⭕ XOX Oyunu',
          description: `${interaction.user} (**X**) vs ${opponent} (**O**)\n\nSıra: ${nextUser} (**${symbol}**)`,
        })],
        components: buildComponents(game.board),
      });
    });

    collector.on('end', (_, reason) => {
      if (reason === 'time') games.delete(gameId);
    });
  },
};
