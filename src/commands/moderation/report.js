import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed, createEmbed, infoEmbed } from '../../utils/embed.js';

// guildId -> { logChannelId }
export const reportConfig = new Map();

export default {
  category: '🔨 Moderasyon',
  cooldown: 30,
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Raporlama sistemi')
    .addSubcommand(s =>
      s.setName('kur')
        .setDescription('Rapor log kanalını ayarla')
        .addChannelOption(o => o.setName('kanal').setDescription('Log kanalı').setRequired(true))
    )
    .addSubcommand(s =>
      s.setName('gonder')
        .setDescription('Kullanıcıyı raporla')
        .addUserOption(o => o.setName('kullanici').setDescription('Raporlanacak kullanıcı').setRequired(true))
        .addStringOption(o => o.setName('sebep').setDescription('Rapor sebebi').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === 'kur') {
      const ch = interaction.options.getChannel('kanal');
      reportConfig.set(gid, { logChannelId: ch.id });
      return interaction.reply({ embeds: [successEmbed(`Rapor log kanalı ${ch} olarak ayarlandı.`, '📋 Rapor Sistemi')] });
    }

    if (sub === 'gonder') {
      const cfg = reportConfig.get(gid);
      if (!cfg) return interaction.reply({ embeds: [errorEmbed('Rapor sistemi kurulmamış. Yöneticiye bildir.')], ephemeral: true });

      const target = interaction.options.getUser('kullanici');
      const reason = interaction.options.getString('sebep');

      if (target.id === interaction.user.id) return interaction.reply({ embeds: [errorEmbed('Kendini raporlayamazsın.')], ephemeral: true });

      const logCh = interaction.guild.channels.cache.get(cfg.logChannelId);
      await logCh?.send({
        embeds: [createEmbed({
          type: 'warning',
          title: '🚨 Yeni Rapor',
          fields: [
            { name: '👤 Raporlanan', value: `${target} (${target.username})`, inline: true },
            { name: '📢 Raporlayan', value: `${interaction.user}`, inline: true },
            { name: '📝 Sebep', value: reason, inline: false },
            { name: '📍 Kanal', value: `${interaction.channel}`, inline: true },
            { name: '🕐 Zaman', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
          ],
        })],
      });

      return interaction.reply({ embeds: [successEmbed('Raporun iletildi. Yetkililer inceleyecek.', '✅ Rapor Gönderildi')], ephemeral: true });
    }
  },
};
