import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, infoEmbed } from '../../utils/embed.js';

// stickerId -> count
export const stickerUsage = new Map();

export function trackSticker(stickerId) {
  stickerUsage.set(stickerId, (stickerUsage.get(stickerId) ?? 0) + 1);
}

export default {
  category: '📊 İstatistik',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('stickerstats')
    .setDescription('Sticker kullanım istatistiklerini gösterir'),

  async execute(interaction) {
    const guild = interaction.guild;
    const guildStickerIds = new Set(guild.stickers.cache.keys());

    const entries = [...stickerUsage.entries()]
      .filter(([id]) => guildStickerIds.has(id))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    if (!entries.length) {
      return interaction.reply({ embeds: [infoEmbed('Henüz sticker kullanım verisi yok.', '🎨 Sticker İstatistikleri')] });
    }

    const list = entries.map(([id, count], i) => {
      const sticker = guild.stickers.cache.get(id);
      return `**${i + 1}.** \`${sticker?.name ?? id}\` — **${count}** kullanım`;
    }).join('\n');

    return interaction.reply({
      embeds: [createEmbed({ type: 'info', title: '🎨 Sticker Kullanım İstatistikleri', description: list })],
    });
  },
};
