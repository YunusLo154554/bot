import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed, successEmbed, errorEmbed } from '../../utils/embed.js';

// guildId -> { channelId, enabled }
export const roleLogConfig = new Map();

export async function logRoleEvent(guild, type, data) {
  const cfg = roleLogConfig.get(guild.id);
  if (!cfg?.enabled) return;
  const ch = guild.channels.cache.get(cfg.channelId);
  if (!ch) return;

  const titles = {
    create: '🎭 Rol Oluşturuldu',
    delete: '🗑️ Rol Silindi',
    update: '✏️ Rol Güncellendi',
    add: '➕ Rol Verildi',
    remove: '➖ Rol Alındı',
  };

  await ch.send({
    embeds: [createEmbed({
      type: ['create', 'add'].includes(type) ? 'success' : ['delete', 'remove'].includes(type) ? 'error' : 'info',
      title: titles[type] ?? '🎭 Rol Olayı',
      fields: [
        { name: '🎭 Rol', value: data.roleName ?? 'Bilinmiyor', inline: true },
        ...(data.target ? [{ name: '👤 Kullanıcı', value: data.target, inline: true }] : []),
        ...(data.moderator ? [{ name: '👮 Yetkili', value: data.moderator, inline: true }] : []),
      ],
    })],
  }).catch(() => null);
}

export default {
  category: '📋 Log',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName('rolelog')
    .setDescription('Rol log sistemini yönetir')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s =>
      s.setName('kur')
        .setDescription('Rol log kanalını ayarla')
        .addChannelOption(o => o.setName('kanal').setDescription('Log kanalı').setRequired(true))
    )
    .addSubcommand(s => s.setName('kapat').setDescription('Rol logunu kapat'))
    .addSubcommand(s => s.setName('durum').setDescription('Mevcut ayarları göster')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === 'kur') {
      const ch = interaction.options.getChannel('kanal');
      roleLogConfig.set(gid, { channelId: ch.id, enabled: true });
      return interaction.reply({ embeds: [successEmbed(`Rol log kanalı ${ch} olarak ayarlandı.`, '📋 Rol Log')] });
    }

    if (sub === 'kapat') {
      const cfg = roleLogConfig.get(gid);
      if (cfg) cfg.enabled = false;
      return interaction.reply({ embeds: [successEmbed('Rol log sistemi kapatıldı.')] });
    }

    if (sub === 'durum') {
      const cfg = roleLogConfig.get(gid);
      if (!cfg) return interaction.reply({ embeds: [errorEmbed('Rol log sistemi kurulmamış.')], ephemeral: true });
      return interaction.reply({
        embeds: [createEmbed({
          type: 'info',
          title: '📋 Rol Log Durumu',
          fields: [
            { name: '📢 Kanal', value: `<#${cfg.channelId}>`, inline: true },
            { name: '🔘 Durum', value: cfg.enabled ? '✅ Aktif' : '❌ Kapalı', inline: true },
          ],
        })],
      });
    }
  },
};
