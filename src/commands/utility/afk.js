import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, infoEmbed } from '../../utils/embed.js';

// userId -> { reason, since }
export const afkMap = new Map();

export default {
  category: '⚙️ Yönetim',
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('AFK modunu aç/kapat')
    .addStringOption(opt =>
      opt.setName('sebep').setDescription('AFK sebebi').setRequired(false)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;

    if (afkMap.has(userId)) {
      const { since } = afkMap.get(userId);
      afkMap.delete(userId);
      const elapsed = Math.floor((Date.now() - since) / 1000);
      return interaction.reply({
        embeds: [successEmbed(`AFK modu kapatıldı. **${elapsed}s** AFK'daydın.`, '👋 Hoş Geldin')],
      });
    }

    const reason = interaction.options.getString('sebep') ?? 'Sebep belirtilmedi';
    afkMap.set(userId, { reason, since: Date.now() });

    await interaction.reply({
      embeds: [infoEmbed(`AFK modu açıldı.\n📝 Sebep: ${reason}`, '💤 AFK')],
    });
  },
};
