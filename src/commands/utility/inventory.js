import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, infoEmbed } from '../../utils/embed.js';

// userId_guildId -> Map<itemName, { count, emoji }>
export const inventoryData = new Map();

export function addItem(userId, guildId, item, emoji = '📦', count = 1) {
  const key = `${userId}_${guildId}`;
  if (!inventoryData.has(key)) inventoryData.set(key, new Map());
  const inv = inventoryData.get(key);
  const existing = inv.get(item) ?? { count: 0, emoji };
  existing.count += count;
  inv.set(item, existing);
}

export default {
  category: '💰 Ekonomi',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Envanterini göster')
    .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı (boş = sen)').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('kullanici') ?? interaction.user;
    const key = `${target.id}_${interaction.guild.id}`;
    const inv = inventoryData.get(key);

    if (!inv?.size) {
      return interaction.reply({ embeds: [infoEmbed(`**${target.username}**'in envanteri boş.`, '🎒 Envanter')] });
    }

    const items = [...inv.entries()]
      .map(([name, data]) => `${data.emoji} **${name}** × ${data.count}`)
      .join('\n');

    await interaction.reply({
      embeds: [createEmbed({
        type: 'info',
        title: `🎒 ${target.username} — Envanter`,
        description: items,
        thumbnail: target.displayAvatarURL(),
      })],
    });
  },
};
