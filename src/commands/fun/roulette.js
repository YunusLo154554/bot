import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embed.js';

const RED   = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const BLACK = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

export default {
  category: '🎮 Eğlence',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('roulette')
    .setDescription('Rulet oyna')
    .addStringOption(o =>
      o.setName('bahis')
        .setDescription('Bahis türü: kırmızı, siyah, tek, çift, 1-18, 19-36 veya sayı (0-36)')
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName('miktar').setDescription('Bahis miktarı (1-500)').setRequired(false).setMinValue(1).setMaxValue(500)
    ),

  async execute(interaction) {
    const betType = interaction.options.getString('bahis').toLowerCase().trim();
    const amount  = interaction.options.getInteger('miktar') ?? 50;
    const num     = Math.floor(Math.random() * 37); // 0-36
    const color   = num === 0 ? '🟢' : RED.includes(num) ? '🔴' : '⚫';

    let win = false;
    let multiplier = 1;

    if (betType === 'kırmızı' || betType === 'kirmizi') {
      win = RED.includes(num); multiplier = 2;
    } else if (betType === 'siyah') {
      win = BLACK.includes(num); multiplier = 2;
    } else if (betType === 'tek') {
      win = num !== 0 && num % 2 === 1; multiplier = 2;
    } else if (betType === 'çift' || betType === 'cift') {
      win = num !== 0 && num % 2 === 0; multiplier = 2;
    } else if (betType === '1-18') {
      win = num >= 1 && num <= 18; multiplier = 2;
    } else if (betType === '19-36') {
      win = num >= 19 && num <= 36; multiplier = 2;
    } else {
      const picked = parseInt(betType);
      if (isNaN(picked) || picked < 0 || picked > 36) {
        return interaction.reply({
          embeds: [createEmbed({ type: 'error', title: '❌ Geçersiz Bahis', description: 'Geçerli bahisler: `kırmızı`, `siyah`, `tek`, `çift`, `1-18`, `19-36` veya `0-36` arası bir sayı.' })],
          ephemeral: true,
        });
      }
      win = num === picked; multiplier = 36;
    }

    const earned = win ? amount * multiplier - amount : -amount;

    await interaction.reply({
      embeds: [createEmbed({
        type: win ? 'success' : 'error',
        title: '🎡 Rulet',
        description: `Top durdu: **${color} ${num}**`,
        fields: [
          { name: '🎯 Bahsin', value: betType, inline: true },
          { name: '💰 Miktar', value: `${amount}`, inline: true },
          { name: win ? '🏆 Kazanç' : '💸 Kayıp', value: `${Math.abs(earned)}`, inline: true },
        ],
        footer: win ? `${multiplier}x çarpan uygulandı` : 'Şansını tekrar dene!',
      })],
    });
  },
};
