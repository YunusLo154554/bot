import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, errorEmbed } from '../../utils/embed.js';

export default {
  category: '🔧 Araçlar',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('servericon')
    .setDescription('Sunucu ikonunu göster'),

  async execute(interaction) {
    const guild = interaction.guild;
    const icon = guild.iconURL({ size: 4096, extension: 'png' });

    if (!icon) {
      return interaction.reply({ embeds: [errorEmbed('Bu sunucunun ikonu yok.')], ephemeral: true });
    }

    await interaction.reply({
      embeds: [createEmbed({
        type: 'info',
        title: `🖼️ ${guild.name} — Sunucu İkonu`,
        description: `[PNG](${guild.iconURL({ extension: 'png', size: 4096 })}) | [WebP](${guild.iconURL({ extension: 'webp', size: 4096 })}) | [JPG](${guild.iconURL({ extension: 'jpg', size: 4096 })})`,
        thumbnail: icon,
      })],
    });
  },
};
