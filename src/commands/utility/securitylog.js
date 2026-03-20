import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed, successEmbed, errorEmbed } from '../../utils/embed.js';

// guildId -> { channelId, enabled }
export const securityLogConfig = new Map();

export async function logSecurityEvent(guild, type, data = {}) {
  const cfg = securityLogConfig.get(guild.id);
  if (!cfg?.enabled) return;
  const ch = guild.channels.cache.get(cfg.channelId);
  if (!ch) return;

  const titles = {
    antilink: '🔗 Antilink Tetiklendi',
    anticaps: '🔠 Anticaps Tetiklendi',
    antiraid: '🛡️ Antiraid Tetiklendi',
    spam: '🚫 Spam Tespit Edildi',
    profanity: '🤬 Küfür Tespit Edildi',
    automod: '🤖 Automod Tetiklendi',
    selfbot: '🤖 Self-bot Şüphesi',
  };

  const fields = Object.entries(data).map(([k, v]) => ({ name: k, value: String(v).slice(0, 1024), inline: true }));

  await ch.send({
    embeds: [createEmbed({
      type: 'error',
      title: titles[type] ?? `🔒 Güvenlik: ${type}`,
      fields,
    })],
  }).catch(() => null);
}

export default {
  category: '📋 Log',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName('securitylog')
    .setDescription('Güvenlik log sistemini yönetir')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s =>
      s.setName('kur')
        .setDescription('Güvenlik log kanalını ayarla')
        .addChannelOption(o => o.setName('kanal').setDescription('Log kanalı').setRequired(true))
    )
    .addSubcommand(s => s.setName('kapat').setDescription('Güvenlik logunu kapat'))
    .addSubcommand(s => s.setName('durum').setDescription('Mevcut ayarları göster')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === 'kur') {
      const ch = interaction.options.getChannel('kanal');
      securityLogConfig.set(gid, { channelId: ch.id, enabled: true });
      return interaction.reply({ embeds: [successEmbed(`Güvenlik log kanalı ${ch} olarak ayarlandı.`, '🔒 Güvenlik Log')] });
    }

    if (sub === 'kapat') {
      const cfg = securityLogConfig.get(gid);
      if (cfg) cfg.enabled = false;
      return interaction.reply({ embeds: [successEmbed('Güvenlik log sistemi kapatıldı.')] });
    }

    if (sub === 'durum') {
      const cfg = securityLogConfig.get(gid);
      if (!cfg) return interaction.reply({ embeds: [errorEmbed('Güvenlik log sistemi kurulmamış.')], ephemeral: true });
      return interaction.reply({
        embeds: [createEmbed({
          type: 'info',
          title: '🔒 Güvenlik Log Durumu',
          fields: [
            { name: '📢 Kanal', value: `<#${cfg.channelId}>`, inline: true },
            { name: '🔘 Durum', value: cfg.enabled ? '✅ Aktif' : '❌ Kapalı', inline: true },
          ],
        })],
      });
    }
  },
};
