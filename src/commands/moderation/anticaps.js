import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, infoEmbed } from '../../utils/embed.js';

// guildId -> { enabled, threshold: number (0-100), minLength }
export const anticapsConfig = new Map();

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName('anticaps')
    .setDescription('Büyük harf korumasını yönet')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s =>
      s.setName('aç')
        .setDescription('Anticaps sistemini etkinleştir')
        .addIntegerOption(o => o.setName('esik').setDescription('Büyük harf yüzdesi eşiği (varsayılan: 70)').setMinValue(10).setMaxValue(100).setRequired(false))
        .addIntegerOption(o => o.setName('minuzunluk').setDescription('Minimum mesaj uzunluğu (varsayılan: 8)').setMinValue(1).setRequired(false))
    )
    .addSubcommand(s => s.setName('kapat').setDescription('Anticaps sistemini devre dışı bırak'))
    .addSubcommand(s => s.setName('durum').setDescription('Mevcut ayarları göster')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (!anticapsConfig.has(gid)) anticapsConfig.set(gid, { enabled: false, threshold: 70, minLength: 8 });
    const cfg = anticapsConfig.get(gid);

    if (sub === 'aç') {
      cfg.enabled = true;
      cfg.threshold = interaction.options.getInteger('esik') ?? cfg.threshold;
      cfg.minLength = interaction.options.getInteger('minuzunluk') ?? cfg.minLength;
      return interaction.reply({
        embeds: [successEmbed(`Anticaps etkinleştirildi.\n📊 Eşik: **%${cfg.threshold}**\n📏 Min uzunluk: **${cfg.minLength}** karakter`, '🔠 Anticaps Açık')],
      });
    }
    if (sub === 'kapat') {
      cfg.enabled = false;
      return interaction.reply({ embeds: [successEmbed('Anticaps devre dışı bırakıldı.', '🔠 Anticaps Kapalı')] });
    }
    if (sub === 'durum') {
      return interaction.reply({
        embeds: [infoEmbed(`**Durum:** ${cfg.enabled ? '✅ Açık' : '❌ Kapalı'}\n**Eşik:** %${cfg.threshold}\n**Min uzunluk:** ${cfg.minLength} karakter`, '🔠 Anticaps Durumu')],
      });
    }
  },
};
