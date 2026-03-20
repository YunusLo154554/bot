import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed, successEmbed, errorEmbed } from '../../utils/embed.js';

// guildId -> { channelId, enabled, events: Set }
export const serverLogConfig = new Map();

const ALL_EVENTS = ['ban', 'unban', 'kick', 'role_create', 'role_delete', 'channel_create', 'channel_delete', 'guild_update'];

export async function logServerEvent(guild, type, data = {}) {
  const cfg = serverLogConfig.get(guild.id);
  if (!cfg?.enabled) return;
  if (cfg.events?.size && !cfg.events.has(type)) return;
  const ch = guild.channels.cache.get(cfg.channelId);
  if (!ch) return;

  const titles = {
    ban: '🔨 Kullanıcı Yasaklandı',
    unban: '✅ Yasak Kaldırıldı',
    kick: '👢 Kullanıcı Atıldı',
    role_create: '🎭 Rol Oluşturuldu',
    role_delete: '🗑️ Rol Silindi',
    channel_create: '📢 Kanal Oluşturuldu',
    channel_delete: '🗑️ Kanal Silindi',
    guild_update: '⚙️ Sunucu Güncellendi',
  };

  const fields = Object.entries(data).map(([k, v]) => ({ name: k, value: String(v).slice(0, 1024), inline: true }));

  await ch.send({
    embeds: [createEmbed({
      type: 'warn',
      title: titles[type] ?? `📋 ${type}`,
      fields,
    })],
  }).catch(() => null);
}

export default {
  category: '📋 Log',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName('serverlog')
    .setDescription('Sunucu log sistemini yönetir')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s =>
      s.setName('kur')
        .setDescription('Sunucu log kanalını ayarla')
        .addChannelOption(o => o.setName('kanal').setDescription('Log kanalı').setRequired(true))
    )
    .addSubcommand(s => s.setName('kapat').setDescription('Sunucu logunu kapat'))
    .addSubcommand(s => s.setName('durum').setDescription('Mevcut ayarları göster')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === 'kur') {
      const ch = interaction.options.getChannel('kanal');
      serverLogConfig.set(gid, { channelId: ch.id, enabled: true, events: new Set(ALL_EVENTS) });
      return interaction.reply({ embeds: [successEmbed(`Sunucu log kanalı ${ch} olarak ayarlandı.`, '📋 Sunucu Log')] });
    }

    if (sub === 'kapat') {
      const cfg = serverLogConfig.get(gid);
      if (cfg) cfg.enabled = false;
      return interaction.reply({ embeds: [successEmbed('Sunucu log sistemi kapatıldı.')] });
    }

    if (sub === 'durum') {
      const cfg = serverLogConfig.get(gid);
      if (!cfg) return interaction.reply({ embeds: [errorEmbed('Sunucu log sistemi kurulmamış.')], ephemeral: true });
      return interaction.reply({
        embeds: [createEmbed({
          type: 'info',
          title: '📋 Sunucu Log Durumu',
          fields: [
            { name: '📢 Kanal', value: `<#${cfg.channelId}>`, inline: true },
            { name: '🔘 Durum', value: cfg.enabled ? '✅ Aktif' : '❌ Kapalı', inline: true },
            { name: '📋 Olaylar', value: ALL_EVENTS.join(', '), inline: false },
          ],
        })],
      });
    }
  },
};
