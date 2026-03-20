import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, infoEmbed } from '../../utils/embed.js';

// guildId -> { enabled, joinThreshold, joinWindow(ms), action: 'kick'|'ban'|'timeout' }
export const antiraidConfig = new Map();
// guildId -> [timestamp, ...]
export const joinLog = new Map();

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName('antiraid')
    .setDescription('Raid koruma sistemini yönet')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s =>
      s.setName('aç')
        .setDescription('Antiraid sistemini etkinleştir')
        .addIntegerOption(o => o.setName('esik').setDescription('Kaç saniyede kaç kişi (varsayılan: 10 kişi/10sn)').setMinValue(2).setMaxValue(50).setRequired(false))
        .addStringOption(o =>
          o.setName('aksiyon').setDescription('Tespit edilince yapılacak işlem').setRequired(false)
            .addChoices(
              { name: 'Kick', value: 'kick' },
              { name: 'Ban', value: 'ban' },
              { name: 'Timeout (10dk)', value: 'timeout' },
            )
        )
    )
    .addSubcommand(s => s.setName('kapat').setDescription('Antiraid sistemini devre dışı bırak'))
    .addSubcommand(s => s.setName('durum').setDescription('Mevcut ayarları göster')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (!antiraidConfig.has(gid)) antiraidConfig.set(gid, { enabled: false, joinThreshold: 10, joinWindow: 10000, action: 'kick' });
    const cfg = antiraidConfig.get(gid);

    if (sub === 'aç') {
      cfg.enabled = true;
      cfg.joinThreshold = interaction.options.getInteger('esik') ?? cfg.joinThreshold;
      cfg.action = interaction.options.getString('aksiyon') ?? cfg.action;
      return interaction.reply({
        embeds: [successEmbed(
          `Antiraid etkinleştirildi.\n👥 Eşik: **${cfg.joinThreshold} kişi / 10 saniye**\n⚡ Aksiyon: **${cfg.action}**`,
          '🛡️ Antiraid Açık'
        )],
      });
    }
    if (sub === 'kapat') {
      cfg.enabled = false;
      return interaction.reply({ embeds: [successEmbed('Antiraid devre dışı bırakıldı.', '🛡️ Antiraid Kapalı')] });
    }
    if (sub === 'durum') {
      return interaction.reply({
        embeds: [infoEmbed(
          `**Durum:** ${cfg.enabled ? '✅ Açık' : '❌ Kapalı'}\n**Eşik:** ${cfg.joinThreshold} kişi/10sn\n**Aksiyon:** ${cfg.action}`,
          '🛡️ Antiraid Durumu'
        )],
      });
    }
  },
};
