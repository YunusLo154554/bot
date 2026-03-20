import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embed.js';

const CHOICES = ['taş', 'kağıt', 'makas'];
const EMOJI = { taş: '🪨', kağıt: '📄', makas: '✂️' };

// returns 'win' | 'lose' | 'draw'
function getResult(player, bot) {
  if (player === bot) return 'draw';
  if (
    (player === 'taş' && bot === 'makas') ||
    (player === 'kağıt' && bot === 'taş') ||
    (player === 'makas' && bot === 'kağıt')
  ) return 'win';
  return 'lose';
}

export default {
  category: '🎮 Eğlence',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Taş Kağıt Makas oyna')
    .addStringOption(opt =>
      opt.setName('seçim')
        .setDescription('Seçimini yap')
        .setRequired(true)
        .addChoices(
          { name: '🪨 Taş', value: 'taş' },
          { name: '📄 Kağıt', value: 'kağıt' },
          { name: '✂️ Makas', value: 'makas' },
        )
    ),

  async execute(interaction) {
    const player = interaction.options.getString('seçim');
    const bot = CHOICES[Math.floor(Math.random() * 3)];
    const result = getResult(player, bot);

    const typeMap = { win: 'success', lose: 'error', draw: 'warning' };
    const titleMap = { win: '🏆 Kazandın!', lose: '💀 Kaybettin!', draw: '🤝 Berabere!' };

    await interaction.reply({
      embeds: [createEmbed({
        type: typeMap[result],
        title: titleMap[result],
        fields: [
          { name: `${interaction.user.username}`, value: `${EMOJI[player]} ${player}`, inline: true },
          { name: 'Bot', value: `${EMOJI[bot]} ${bot}`, inline: true },
        ],
      })],
    });
  },
};
