import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, infoEmbed } from '../../utils/embed.js';
import { levelData } from './level.js';
import { economyData } from './economy.js';

export default {
  category: '🔧 Araçlar',
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Liderlik tablosunu göster')
    .addStringOption(o =>
      o.setName('tur').setDescription('Tür').setRequired(false)
        .addChoices(
          { name: '⭐ Seviye', value: 'level' },
          { name: '💰 Ekonomi', value: 'economy' },
        )
    ),

  async execute(interaction) {
    const type = interaction.options.getString('tur') ?? 'level';
    const gid = interaction.guild.id;
    const medals = ['🥇', '🥈', '🥉'];

    if (type === 'level') {
      const entries = [...levelData.entries()]
        .filter(([k]) => k.endsWith(`_${gid}`))
        .sort((a, b) => b[1].level - a[1].level || b[1].xp - a[1].xp)
        .slice(0, 10);

      if (!entries.length) return interaction.reply({ embeds: [infoEmbed('Henüz seviye verisi yok.', '⭐ Liderlik')] });

      const list = entries.map(([k, d], i) => {
        const uid = k.split('_')[0];
        return `${medals[i] ?? `**${i + 1}.**`} <@${uid}> — Seviye **${d.level}** · ${d.xp} XP`;
      }).join('\n');

      return interaction.reply({ embeds: [createEmbed({ type: 'info', title: '⭐ Seviye Liderlik Tablosu', description: list })] });
    }

    if (type === 'economy') {
      const entries = [...economyData.entries()]
        .filter(([k]) => k.endsWith(`_${gid}`))
        .map(([k, d]) => ({ uid: k.split('_')[0], total: d.balance + d.bank }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      if (!entries.length) return interaction.reply({ embeds: [infoEmbed('Henüz ekonomi verisi yok.', '💰 Liderlik')] });

      const list = entries.map((e, i) =>
        `${medals[i] ?? `**${i + 1}.**`} <@${e.uid}> — **${e.total} 🪙**`
      ).join('\n');

      return interaction.reply({ embeds: [createEmbed({ type: 'info', title: '💰 Zenginler Liderlik Tablosu', description: list })] });
    }
  },
};
