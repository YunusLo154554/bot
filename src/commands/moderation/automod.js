import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, infoEmbed, createEmbed } from '../../utils/embed.js';

// guildId -> { mentionLimit, duplicateMsg, inviteBlock, capsThreshold }
export const automodConfig = new Map();

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Otomatik moderasyon ayarlarını yönet')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s =>
      s.setName('kur')
        .setDescription('Automod ayarlarını yapılandır')
        .addIntegerOption(o => o.setName('mentionlimit').setDescription('Max mention sayısı (0 = kapalı)').setMinValue(0).setMaxValue(50).setRequired(false))
        .addBooleanOption(o => o.setName('davetengel').setDescription('Discord davet linklerini engelle').setRequired(false))
        .addBooleanOption(o => o.setName('tekrarmesaj').setDescription('Tekrar eden mesajları engelle').setRequired(false))
    )
    .addSubcommand(s => s.setName('sifirla').setDescription('Automod ayarlarını sıfırla'))
    .addSubcommand(s => s.setName('durum').setDescription('Mevcut automod ayarlarını göster')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === 'kur') {
      const existing = automodConfig.get(gid) ?? {};
      const cfg = {
        enabled: true,
        mentionLimit: interaction.options.getInteger('mentionlimit') ?? existing.mentionLimit ?? 5,
        inviteBlock: interaction.options.getBoolean('davetengel') ?? existing.inviteBlock ?? true,
        duplicateMsg: interaction.options.getBoolean('tekrarmesaj') ?? existing.duplicateMsg ?? true,
      };
      automodConfig.set(gid, cfg);

      return interaction.reply({
        embeds: [successEmbed(
          `Automod yapılandırıldı!\n👥 Max mention: **${cfg.mentionLimit}**\n🔗 Davet engeli: **${cfg.inviteBlock ? 'Açık' : 'Kapalı'}**\n🔁 Tekrar mesaj: **${cfg.duplicateMsg ? 'Açık' : 'Kapalı'}**`,
          '🤖 Automod Kuruldu'
        )],
      });
    }

    if (sub === 'sifirla') {
      automodConfig.delete(gid);
      return interaction.reply({ embeds: [successEmbed('Automod ayarları sıfırlandı.')] });
    }

    if (sub === 'durum') {
      const cfg = automodConfig.get(gid);
      if (!cfg) return interaction.reply({ embeds: [infoEmbed('Automod yapılandırılmamış.', '🤖 Automod')] });

      return interaction.reply({
        embeds: [createEmbed({
          type: 'info',
          title: '🤖 Automod Durumu',
          fields: [
            { name: '👥 Max Mention', value: `${cfg.mentionLimit}`, inline: true },
            { name: '🔗 Davet Engeli', value: cfg.inviteBlock ? '✅ Açık' : '❌ Kapalı', inline: true },
            { name: '🔁 Tekrar Mesaj', value: cfg.duplicateMsg ? '✅ Açık' : '❌ Kapalı', inline: true },
          ],
        })],
      });
    }
  },
};
