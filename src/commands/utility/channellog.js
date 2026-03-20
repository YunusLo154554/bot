import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed, successEmbed, errorEmbed } from '../../utils/embed.js';

// guildId -> { channelId, enabled }
export const channelLogConfig = new Map();

export async function logChannelEvent(guild, type, data) {
  const cfg = channelLogConfig.get(guild.id);
  if (!cfg?.enabled) return;
  const ch = guild.channels.cache.get(cfg.channelId);
  if (!ch) return;

  const titles = {
    create: '📢 Kanal Oluşturuldu',
    delete: '🗑️ Kanal Silindi',
    update: '✏️ Kanal Güncellendi',
  };

  await ch.send({
    embeds: [createEmbed({
      type: type === 'create' ? 'success' : type === 'delete' ? 'error' : 'info',
      title: titles[type] ?? '📢 Kanal Olayı',
      fields: [
        { name: '📢 Kanal', value: data.name ?? 'Bilinmiyor', inline: true },
        { name: '🆔 ID', value: data.id ?? '?', inline: true },
        { name: '📁 Tür', value: data.type ?? 'Bilinmiyor', inline: true },
      ],
    })],
  }).catch(() => null);
}

export default {
  category: '📋 Log',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName('channellog')
    .setDescription('Kanal log sistemini yönetir')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s =>
      s.setName('kur')
        .setDescription('Kanal log kanalını ayarla')
        .addChannelOption(o => o.setName('kanal').setDescription('Log kanalı').setRequired(true))
    )
    .addSubcommand(s => s.setName('kapat').setDescription('Kanal logunu kapat'))
    .addSubcommand(s => s.setName('durum').setDescription('Mevcut ayarları göster')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === 'kur') {
      const ch = interaction.options.getChannel('kanal');
      channelLogConfig.set(gid, { channelId: ch.id, enabled: true });
      return interaction.reply({ embeds: [successEmbed(`Kanal log kanalı ${ch} olarak ayarlandı.`, '📋 Kanal Log')] });
    }

    if (sub === 'kapat') {
      const cfg = channelLogConfig.get(gid);
      if (cfg) cfg.enabled = false;
      return interaction.reply({ embeds: [successEmbed('Kanal log sistemi kapatıldı.')] });
    }

    if (sub === 'durum') {
      const cfg = channelLogConfig.get(gid);
      if (!cfg) return interaction.reply({ embeds: [errorEmbed('Kanal log sistemi kurulmamış.')], ephemeral: true });
      return interaction.reply({
        embeds: [createEmbed({
          type: 'info',
          title: '📋 Kanal Log Durumu',
          fields: [
            { name: '📢 Kanal', value: `<#${cfg.channelId}>`, inline: true },
            { name: '🔘 Durum', value: cfg.enabled ? '✅ Aktif' : '❌ Kapalı', inline: true },
          ],
        })],
      });
    }
  },
};
