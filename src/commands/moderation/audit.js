import { SlashCommandBuilder, PermissionFlagsBits, AuditLogEvent } from 'discord.js';
import { createEmbed, errorEmbed } from '../../utils/embed.js';

const ACTION_NAMES = {
  [AuditLogEvent.MemberBan]: '🔨 Ban',
  [AuditLogEvent.MemberUnban]: '✅ Unban',
  [AuditLogEvent.MemberKick]: '👢 Kick',
  [AuditLogEvent.MemberUpdate]: '✏️ Üye Güncelleme',
  [AuditLogEvent.ChannelCreate]: '📢 Kanal Oluşturma',
  [AuditLogEvent.ChannelDelete]: '🗑️ Kanal Silme',
  [AuditLogEvent.RoleCreate]: '🎭 Rol Oluşturma',
  [AuditLogEvent.RoleDelete]: '🗑️ Rol Silme',
  [AuditLogEvent.MessageDelete]: '🗑️ Mesaj Silme',
  [AuditLogEvent.GuildUpdate]: '⚙️ Sunucu Güncelleme',
};

export default {
  category: '🔨 Moderasyon',
  cooldown: 10,
  permissions: [PermissionFlagsBits.ViewAuditLog],
  data: new SlashCommandBuilder()
    .setName('audit')
    .setDescription('Sunucu denetim loglarını görüntüle')
    .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog)
    .addIntegerOption(o => o.setName('limit').setDescription('Gösterilecek kayıt sayısı (1-20)').setMinValue(1).setMaxValue(20).setRequired(false))
    .addUserOption(o => o.setName('kullanici').setDescription('Belirli bir kullanıcının logları').setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const limit = interaction.options.getInteger('limit') ?? 10;
    const user = interaction.options.getUser('kullanici');

    try {
      const logs = await interaction.guild.fetchAuditLogs({ limit, user: user ?? undefined });

      if (!logs.entries.size) {
        return interaction.editReply({ embeds: [errorEmbed('Denetim logu bulunamadı.')] });
      }

      const entries = [...logs.entries.values()].map(entry => {
        const action = ACTION_NAMES[entry.action] ?? `Eylem #${entry.action}`;
        const executor = entry.executor ? `<@${entry.executor.id}>` : 'Bilinmiyor';
        const target = entry.target?.id ? `<@${entry.target.id}>` : (entry.target?.name ?? 'Bilinmiyor');
        const time = `<t:${Math.floor(entry.createdTimestamp / 1000)}:R>`;
        return `${action} — ${executor} → ${target} ${time}`;
      }).join('\n');

      await interaction.editReply({
        embeds: [createEmbed({
          type: 'info',
          title: `📋 Denetim Logu (${logs.entries.size} kayıt)`,
          description: entries,
          footer: user ? `${user.username} için filtrelendi` : undefined,
        })],
      });
    } catch (err) {
      await interaction.editReply({ embeds: [errorEmbed(`Log alınamadı: ${err.message}`)] });
    }
  },
};
