import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed, successEmbed, errorEmbed } from '../../utils/embed.js';

// guildId -> { channelId, enabled, logEdits, logDeletes }
export const messageLogConfig = new Map();

export async function logMessageEvent(guild, type, data) {
  const cfg = messageLogConfig.get(guild.id);
  if (!cfg?.enabled) return;
  if (type === 'edit' && !cfg.logEdits) return;
  if (type === 'delete' && !cfg.logDeletes) return;

  const ch = guild.channels.cache.get(cfg.channelId);
  if (!ch) return;

  if (type === 'delete') {
    await ch.send({
      embeds: [createEmbed({
        type: 'warn',
        title: '🗑️ Mesaj Silindi',
        fields: [
          { name: '👤 Kullanıcı', value: `${data.author?.username ?? 'Bilinmiyor'} (${data.author?.id ?? '?'})`, inline: true },
          { name: '📢 Kanal', value: `<#${data.channelId}>`, inline: true },
          { name: '📝 İçerik', value: data.content?.slice(0, 1024) || '*Boş*', inline: false },
        ],
      })],
    }).catch(() => null);
  }

  if (type === 'edit') {
    await ch.send({
      embeds: [createEmbed({
        type: 'info',
        title: '✏️ Mesaj Düzenlendi',
        fields: [
          { name: '👤 Kullanıcı', value: `${data.author?.username ?? 'Bilinmiyor'}`, inline: true },
          { name: '📢 Kanal', value: `<#${data.channelId}>`, inline: true },
          { name: '📝 Eski İçerik', value: data.oldContent?.slice(0, 512) || '*Boş*', inline: false },
          { name: '📝 Yeni İçerik', value: data.newContent?.slice(0, 512) || '*Boş*', inline: false },
        ],
      })],
    }).catch(() => null);
  }
}

export default {
  category: '📋 Log',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName('messagelog')
    .setDescription('Mesaj log sistemini yönetir')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s =>
      s.setName('kur')
        .setDescription('Mesaj log kanalını ayarla')
        .addChannelOption(o => o.setName('kanal').setDescription('Log kanalı').setRequired(true))
        .addBooleanOption(o => o.setName('silme').setDescription('Silinen mesajları logla').setRequired(false))
        .addBooleanOption(o => o.setName('duzenleme').setDescription('Düzenlenen mesajları logla').setRequired(false))
    )
    .addSubcommand(s => s.setName('kapat').setDescription('Mesaj logunu kapat'))
    .addSubcommand(s => s.setName('durum').setDescription('Mevcut ayarları göster')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === 'kur') {
      const ch = interaction.options.getChannel('kanal');
      const logDeletes = interaction.options.getBoolean('silme') ?? true;
      const logEdits = interaction.options.getBoolean('duzenleme') ?? true;
      messageLogConfig.set(gid, { channelId: ch.id, enabled: true, logDeletes, logEdits });
      return interaction.reply({ embeds: [successEmbed(`Mesaj log kanalı ${ch} olarak ayarlandı.\n🗑️ Silme: ${logDeletes ? '✅' : '❌'} | ✏️ Düzenleme: ${logEdits ? '✅' : '❌'}`, '📋 Mesaj Log')] });
    }

    if (sub === 'kapat') {
      const cfg = messageLogConfig.get(gid);
      if (cfg) cfg.enabled = false;
      return interaction.reply({ embeds: [successEmbed('Mesaj log sistemi kapatıldı.')] });
    }

    if (sub === 'durum') {
      const cfg = messageLogConfig.get(gid);
      if (!cfg) return interaction.reply({ embeds: [errorEmbed('Mesaj log sistemi kurulmamış.')], ephemeral: true });
      return interaction.reply({
        embeds: [createEmbed({
          type: 'info',
          title: '📋 Mesaj Log Durumu',
          fields: [
            { name: '📢 Kanal', value: `<#${cfg.channelId}>`, inline: true },
            { name: '🔘 Durum', value: cfg.enabled ? '✅ Aktif' : '❌ Kapalı', inline: true },
            { name: '🗑️ Silme Logu', value: cfg.logDeletes ? '✅' : '❌', inline: true },
            { name: '✏️ Düzenleme Logu', value: cfg.logEdits ? '✅' : '❌', inline: true },
          ],
        })],
      });
    }
  },
};
