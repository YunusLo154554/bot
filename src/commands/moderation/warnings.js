import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embed.js';
import { getWarnings } from './warn.js';

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Kullanıcının uyarılarını göster')
    .addUserOption(opt =>
      opt.setName('kullanici').setDescription('Kullanıcı').setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('kullanici');
    const warns = getWarnings(target.id);

    if (!warns.count) {
      return interaction.reply({
        embeds: [createEmbed({
          type: 'success',
          title: '✅ Temiz',
          description: `**${target.username}** hiç uyarısı yok.`,
        })],
        ephemeral: true,
      });
    }

    const reasons = warns.reasons
      .map((r, i) => `${i + 1}. ${r}`)
      .join('\n');

    await interaction.reply({
      embeds: [createEmbed({
        type: 'warning',
        title: `⚠️ ${target.username} — Uyarılar`,
        fields: [
          { name: '📊 Toplam', value: `${warns.count}`, inline: true },
          { name: '📝 Sebepler', value: reasons, inline: false },
        ],
      })],
      ephemeral: true,
    });
  },
};
