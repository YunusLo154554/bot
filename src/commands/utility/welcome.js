import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed, infoEmbed } from '../../utils/embed.js';

// guildId -> { channelId, message, enabled }
export const welcomeConfig = new Map();

export default {
  category: '⚙️ Yönetim',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Hoşgeldin mesajı ayarla')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s =>
      s.setName('kur')
        .setDescription('Hoşgeldin kanalını ve mesajını ayarla')
        .addChannelOption(o => o.setName('kanal').setDescription('Hoşgeldin kanalı').setRequired(true))
        .addStringOption(o => o.setName('mesaj').setDescription('Mesaj ({user} = mention, {server} = sunucu adı)').setRequired(false))
    )
    .addSubcommand(s => s.setName('kapat').setDescription('Hoşgeldin mesajını devre dışı bırak'))
    .addSubcommand(s => s.setName('test').setDescription('Hoşgeldin mesajını test et'))
    .addSubcommand(s => s.setName('durum').setDescription('Mevcut ayarları göster')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === 'kur') {
      const ch = interaction.options.getChannel('kanal');
      const msg = interaction.options.getString('mesaj') ?? '👋 {user} sunucumuza hoş geldin, **{server}**\'a katıldın!';
      welcomeConfig.set(gid, { channelId: ch.id, message: msg, enabled: true });
      return interaction.reply({
        embeds: [successEmbed(`Hoşgeldin sistemi kuruldu!\n📢 Kanal: ${ch}\n💬 Mesaj: ${msg}`, '👋 Welcome Kuruldu')],
      });
    }
    if (sub === 'kapat') {
      const cfg = welcomeConfig.get(gid);
      if (cfg) cfg.enabled = false;
      return interaction.reply({ embeds: [successEmbed('Hoşgeldin mesajı devre dışı bırakıldı.')] });
    }
    if (sub === 'test') {
      const cfg = welcomeConfig.get(gid);
      if (!cfg?.enabled) return interaction.reply({ embeds: [errorEmbed('Hoşgeldin sistemi kurulmamış.')], ephemeral: true });
      const ch = interaction.guild.channels.cache.get(cfg.channelId);
      const text = cfg.message.replace('{user}', `${interaction.user}`).replace('{server}', interaction.guild.name);
      await ch?.send(text);
      return interaction.reply({ embeds: [successEmbed('Test mesajı gönderildi.')], ephemeral: true });
    }
    if (sub === 'durum') {
      const cfg = welcomeConfig.get(gid);
      if (!cfg) return interaction.reply({ embeds: [infoEmbed('Hoşgeldin sistemi kurulmamış.', '👋 Welcome')] });
      return interaction.reply({
        embeds: [infoEmbed(
          `**Durum:** ${cfg.enabled ? '✅ Açık' : '❌ Kapalı'}\n**Kanal:** <#${cfg.channelId}>\n**Mesaj:** ${cfg.message}`,
          '👋 Welcome Durumu'
        )],
      });
    }
  },
};
