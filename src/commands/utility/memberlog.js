import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed, successEmbed, errorEmbed } from '../../utils/embed.js';

// guildId -> { channelId, enabled }
export const memberLogConfig = new Map();

export async function logMemberEvent(guild, type, member) {
  const cfg = memberLogConfig.get(guild.id);
  if (!cfg?.enabled) return;
  const ch = guild.channels.cache.get(cfg.channelId);
  if (!ch) return;

  const isJoin = type === 'join';
  await ch.send({
    embeds: [createEmbed({
      type: isJoin ? 'success' : 'error',
      title: isJoin ? '📥 Üye Katıldı' : '📤 Üye Ayrıldı',
      thumbnail: member.user.displayAvatarURL(),
      fields: [
        { name: '👤 Kullanıcı', value: `${member.user.username} (${member.id})`, inline: true },
        { name: '📅 Hesap Yaşı', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '👥 Üye Sayısı', value: `${guild.memberCount}`, inline: true },
      ],
    })],
  }).catch(() => null);
}

export default {
  category: '📋 Log',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName('memberlog')
    .setDescription('Üye log sistemini yönetir')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s =>
      s.setName('kur')
        .setDescription('Üye log kanalını ayarla')
        .addChannelOption(o => o.setName('kanal').setDescription('Log kanalı').setRequired(true))
    )
    .addSubcommand(s => s.setName('kapat').setDescription('Üye logunu kapat'))
    .addSubcommand(s => s.setName('durum').setDescription('Mevcut ayarları göster')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === 'kur') {
      const ch = interaction.options.getChannel('kanal');
      memberLogConfig.set(gid, { channelId: ch.id, enabled: true });
      return interaction.reply({ embeds: [successEmbed(`Üye log kanalı ${ch} olarak ayarlandı.`, '📋 Üye Log')] });
    }

    if (sub === 'kapat') {
      const cfg = memberLogConfig.get(gid);
      if (cfg) cfg.enabled = false;
      return interaction.reply({ embeds: [successEmbed('Üye log sistemi kapatıldı.')] });
    }

    if (sub === 'durum') {
      const cfg = memberLogConfig.get(gid);
      if (!cfg) return interaction.reply({ embeds: [errorEmbed('Üye log sistemi kurulmamış.')], ephemeral: true });
      return interaction.reply({
        embeds: [createEmbed({
          type: 'info',
          title: '📋 Üye Log Durumu',
          fields: [
            { name: '📢 Kanal', value: `<#${cfg.channelId}>`, inline: true },
            { name: '🔘 Durum', value: cfg.enabled ? '✅ Aktif' : '❌ Kapalı', inline: true },
          ],
        })],
      });
    }
  },
};
