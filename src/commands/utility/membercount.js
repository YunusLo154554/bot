import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { successEmbed, errorEmbed, infoEmbed } from '../../utils/embed.js';

// guildId -> { channelId }
export const membercountConfig = new Map();

export default {
  category: '⚙️ Yönetim',
  cooldown: 10,
  permissions: [PermissionFlagsBits.ManageChannels],
  data: new SlashCommandBuilder()
    .setName('membercount')
    .setDescription('Üye sayısı ses kanalını yönet')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(s =>
      s.setName('kur')
        .setDescription('Üye sayısı kanalı oluştur')
        .addStringOption(o => o.setName('format').setDescription('Format ({count} = sayı, varsayılan: "👥 Üyeler: {count}")').setRequired(false))
    )
    .addSubcommand(s => s.setName('guncelle').setDescription('Sayacı manuel güncelle'))
    .addSubcommand(s => s.setName('sil').setDescription('Sayaç kanalını sil')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;
    const gid = guild.id;

    if (sub === 'kur') {
      const format = interaction.options.getString('format') ?? '👥 Üyeler: {count}';
      const count = guild.memberCount;
      const name = format.replace('{count}', count);

      const channel = await guild.channels.create({
        name,
        type: ChannelType.GuildVoice,
        permissionOverwrites: [{ id: guild.id, deny: [PermissionFlagsBits.Connect] }],
        reason: 'Üye sayısı kanalı',
      });

      membercountConfig.set(gid, { channelId: channel.id, format });
      return interaction.reply({ embeds: [successEmbed(`Üye sayısı kanalı oluşturuldu: ${channel}`, '👥 Membercount')] });
    }

    if (sub === 'guncelle') {
      const cfg = membercountConfig.get(gid);
      if (!cfg) return interaction.reply({ embeds: [errorEmbed('Üye sayısı kanalı kurulmamış.')], ephemeral: true });
      const ch = guild.channels.cache.get(cfg.channelId);
      if (!ch) return interaction.reply({ embeds: [errorEmbed('Kanal bulunamadı.')], ephemeral: true });
      const name = cfg.format.replace('{count}', guild.memberCount);
      await ch.setName(name);
      return interaction.reply({ embeds: [successEmbed(`Kanal güncellendi: **${name}**`)], ephemeral: true });
    }

    if (sub === 'sil') {
      const cfg = membercountConfig.get(gid);
      if (!cfg) return interaction.reply({ embeds: [errorEmbed('Üye sayısı kanalı kurulmamış.')], ephemeral: true });
      const ch = guild.channels.cache.get(cfg.channelId);
      await ch?.delete('Membercount kaldırıldı');
      membercountConfig.delete(gid);
      return interaction.reply({ embeds: [successEmbed('Üye sayısı kanalı silindi.')] });
    }
  },
};
