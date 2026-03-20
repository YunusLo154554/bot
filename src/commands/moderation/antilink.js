import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed, infoEmbed } from '../../utils/embed.js';

// guildId -> { enabled, whitelist: Set<channelId>, warnOnViolation }
export const antilinkConfig = new Map();

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName('antilink')
    .setDescription('Link engelleme sistemini yönet')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName('aç').setDescription('Antilink sistemini etkinleştir'))
    .addSubcommand(s => s.setName('kapat').setDescription('Antilink sistemini devre dışı bırak'))
    .addSubcommand(s =>
      s.setName('whitelist')
        .setDescription('Kanala izin ver / izni kaldır')
        .addChannelOption(o => o.setName('kanal').setDescription('Kanal').setRequired(true))
        .addStringOption(o =>
          o.setName('işlem').setDescription('Ekle veya çıkar').setRequired(true)
            .addChoices({ name: 'Ekle', value: 'ekle' }, { name: 'Çıkar', value: 'cikar' })
        )
    )
    .addSubcommand(s => s.setName('durum').setDescription('Mevcut ayarları göster')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (!antilinkConfig.has(gid)) antilinkConfig.set(gid, { enabled: false, whitelist: new Set() });
    const cfg = antilinkConfig.get(gid);

    if (sub === 'aç') {
      cfg.enabled = true;
      return interaction.reply({ embeds: [successEmbed('Antilink sistemi etkinleştirildi. Linkler silinecek.', '🔗 Antilink Açık')] });
    }
    if (sub === 'kapat') {
      cfg.enabled = false;
      return interaction.reply({ embeds: [successEmbed('Antilink sistemi devre dışı bırakıldı.', '🔗 Antilink Kapalı')] });
    }
    if (sub === 'whitelist') {
      const ch = interaction.options.getChannel('kanal');
      const op = interaction.options.getString('işlem');
      if (op === 'ekle') { cfg.whitelist.add(ch.id); return interaction.reply({ embeds: [successEmbed(`${ch} whitelist'e eklendi.`)] }); }
      cfg.whitelist.delete(ch.id);
      return interaction.reply({ embeds: [successEmbed(`${ch} whitelist'ten çıkarıldı.`)] });
    }
    if (sub === 'durum') {
      const wl = [...cfg.whitelist].map(id => `<#${id}>`).join(', ') || 'Yok';
      return interaction.reply({
        embeds: [infoEmbed(`**Durum:** ${cfg.enabled ? '✅ Açık' : '❌ Kapalı'}\n**Whitelist:** ${wl}`, '🔗 Antilink Durumu')],
      });
    }
  },
};
