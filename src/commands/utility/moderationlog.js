import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed, successEmbed, errorEmbed } from '../../utils/embed.js';

// guildId -> { channelId, enabled }
export const modLogConfig = new Map();

export async function logModAction(guild, action) {
  const cfg = modLogConfig.get(guild.id);
  if (!cfg?.enabled) return;
  const ch = guild.channels.cache.get(cfg.channelId);
  if (!ch) return;

  await ch.send({
    embeds: [createEmbed({
      type: 'warn',
      title: `🔨 Moderasyon: ${action.type}`,
      fields: [
        { name: '👤 Hedef', value: action.target ?? 'Bilinmiyor', inline: true },
        { name: '👮 Yetkili', value: action.moderator ?? 'Sistem', inline: true },
        { name: '📝 Sebep', value: action.reason ?? 'Belirtilmedi', inline: false },
        ...(action.duration ? [{ name: '⏱️ Süre', value: action.duration, inline: true }] : []),
      ],
    })],
  }).catch(() => null);
}

export default {
  category: '📋 Log',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName('moderationlog')
    .setDescription('Moderasyon log sistemini yönetir')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s =>
      s.setName('kur')
        .setDescription('Moderasyon log kanalını ayarla')
        .addChannelOption(o => o.setName('kanal').setDescription('Log kanalı').setRequired(true))
    )
    .addSubcommand(s => s.setName('kapat').setDescription('Moderasyon logunu kapat'))
    .addSubcommand(s => s.setName('durum').setDescription('Mevcut ayarları göster')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === 'kur') {
      const ch = interaction.options.getChannel('kanal');
      modLogConfig.set(gid, { channelId: ch.id, enabled: true });
      return interaction.reply({ embeds: [successEmbed(`Moderasyon log kanalı ${ch} olarak ayarlandı.`, '📋 Moderasyon Log')] });
    }

    if (sub === 'kapat') {
      const cfg = modLogConfig.get(gid);
      if (cfg) cfg.enabled = false;
      return interaction.reply({ embeds: [successEmbed('Moderasyon log sistemi kapatıldı.')] });
    }

    if (sub === 'durum') {
      const cfg = modLogConfig.get(gid);
      if (!cfg) return interaction.reply({ embeds: [errorEmbed('Moderasyon log sistemi kurulmamış.')], ephemeral: true });
      return interaction.reply({
        embeds: [createEmbed({
          type: 'info',
          title: '📋 Moderasyon Log Durumu',
          fields: [
            { name: '📢 Kanal', value: `<#${cfg.channelId}>`, inline: true },
            { name: '🔘 Durum', value: cfg.enabled ? '✅ Aktif' : '❌ Kapalı', inline: true },
          ],
        })],
      });
    }
  },
};
