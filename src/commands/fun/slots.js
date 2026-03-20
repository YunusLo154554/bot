import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embed.js';

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣'];
const WEIGHTS  = [  30,   25,   20,   15,    6,    3,    1]; // toplam 100

function spin() {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  const r = Math.random() * total;
  let acc = 0;
  for (let i = 0; i < SYMBOLS.length; i++) {
    acc += WEIGHTS[i];
    if (r < acc) return SYMBOLS[i];
  }
  return SYMBOLS[0];
}

const PAYOUTS = {
  '7️⃣': 50, '💎': 20, '⭐': 10, '🍇': 5, '🍊': 3, '🍋': 2, '🍒': 1.5,
};

export default {
  category: '🎮 Eğlence',
  cooldown: 4,
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Slot makinesi çevir')
    .addIntegerOption(o =>
      o.setName('bahis').setDescription('Bahis (1-500)').setRequired(false).setMinValue(1).setMaxValue(500)
    ),

  async execute(interaction) {
    const bet = interaction.options.getInteger('bahis') ?? 50;
    const reels = [spin(), spin(), spin()];
    const [a, b, c] = reels;

    let multiplier = 0;
    let result = '';

    if (a === b && b === c) {
      multiplier = PAYOUTS[a] ?? 2;
      result = `🎰 **JACKPOT!** ${a}${b}${c} — ${multiplier}x kazandın!`;
    } else if (a === b || b === c || a === c) {
      multiplier = 0.5;
      result = `✨ İki eşleşme — bahsin iade edildi!`;
    } else {
      result = `😢 Eşleşme yok — ${bet} kaybedildi.`;
    }

    const won = Math.floor(bet * multiplier);

    await interaction.reply({
      embeds: [createEmbed({
        type: multiplier > 1 ? 'success' : multiplier > 0 ? 'warning' : 'error',
        title: '🎰 Slot Makinesi',
        description: `┌─────────────┐\n│  ${a}  ${b}  ${c}  │\n└─────────────┘\n\n${result}`,
        fields: [
          { name: '💰 Bahis', value: `${bet}`, inline: true },
          { name: '🏆 Kazanç', value: `${won}`, inline: true },
        ],
      })],
    });
  },
};
