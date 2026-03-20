import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, infoEmbed } from '../../utils/embed.js';

export default {
  category: '📊 İstatistik',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('rolestats')
    .setDescription('Rol istatistiklerini gösterir')
    .addRoleOption(o => o.setName('rol').setDescription('Belirli bir rol (boş = tüm roller)').setRequired(false)),

  async execute(interaction) {
    const guild = interaction.guild;
    await guild.members.fetch().catch(() => null);

    const targetRole = interaction.options.getRole('rol');

    if (targetRole) {
      const members = guild.members.cache.filter(m => m.roles.cache.has(targetRole.id));
      const list = members.size > 0
        ? [...members.values()].slice(0, 20).map(m => `• ${m.user.username}`).join('\n')
        : 'Bu rolde kimse yok.';

      return interaction.reply({
        embeds: [createEmbed({
          type: 'info',
          title: `🎭 ${targetRole.name} — Rol İstatistikleri`,
          fields: [
            { name: '👥 Üye Sayısı', value: `${members.size}`, inline: true },
            { name: '🎨 Renk', value: targetRole.hexColor, inline: true },
            { name: '📅 Oluşturulma', value: `<t:${Math.floor(targetRole.createdTimestamp / 1000)}:R>`, inline: true },
            { name: `👤 Üyeler (ilk 20)`, value: list.slice(0, 1024), inline: false },
          ],
        })],
      });
    }

    const roles = [...guild.roles.cache.values()]
      .filter(r => !r.managed && r.id !== guild.id)
      .sort((a, b) => b.members.size - a.members.size)
      .slice(0, 15);

    if (!roles.length) return interaction.reply({ embeds: [infoEmbed('Rol verisi bulunamadı.', '🎭 Rol İstatistikleri')] });

    const list = roles.map((r, i) => `**${i + 1}.** ${r} — **${r.members.size}** üye`).join('\n');

    return interaction.reply({
      embeds: [createEmbed({
        type: 'info',
        title: '🎭 Rol İstatistikleri',
        description: list,
        fields: [{ name: '📦 Toplam Rol', value: `${guild.roles.cache.size}`, inline: true }],
      })],
    });
  },
};
