import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, infoEmbed } from '../../utils/embed.js';

// emojiId -> count (in-memory, messageCreate'de artırılır)
export const emojiUsage = new Map();

export function trackEmoji(emojiId) {
  emojiUsage.set(emojiId, (emojiUsage.get(emojiId) ?? 0) + 1);
}

export default {
  category: '📊 İstatistik',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('emojistats')
    .setDescription('Emoji kullanım istatistiklerini gösterir'),

  async execute(interaction) {
    const guild = interaction.guild;
    const guildEmojiIds = new Set(guild.emojis.cache.keys());

    const entries = [...emojiUsage.entries()]
      .filter(([id]) => guildEmojiIds.has(id))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    if (!entries.length) {
      return interaction.reply({ embeds: [infoEmbed('Henüz emoji kullanım verisi yok.\n\n> Not: Veriler bot başlatıldıktan sonra toplanmaya başlar.', '😀 Emoji İstatistikleri')] });
    }

    const list = entries.map(([id, count], i) => {
      const emoji = guild.emojis.cache.get(id);
      return `**${i + 1}.** ${emoji ?? `\`${id}\``} — **${count}** kullanım`;
    }).join('\n');

    return interaction.reply({
      embeds: [createEmbed({
        type: 'info',
        title: '😀 Emoji Kullanım İstatistikleri',
        description: list,
      })],
    });
  },
};
