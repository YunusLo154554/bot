import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';
import { getWarnings, clearUserWarnings } from './warn.js';

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ModerateMembers],
  data: new SlashCommandBuilder()
    .setName('clearwarnings')
    .setDescription('Kullanıcının uyarılarını sıfırla')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt =>
      opt.setName('kullanici').setDescription('Kullanıcı').setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('kullanici');
    const warns = getWarnings(target.id);

    if (!warns.count) {
      return interaction.reply({
        embeds: [errorEmbed(`**${target.username}** zaten uyarısı yok.`)],
        ephemeral: true,
      });
    }

    clearUserWarnings(target.id);

    await interaction.reply({
      embeds: [successEmbed(
        `**${target.username}** uyarıları sıfırlandı (Önceki: ${warns.count})`,
        '✅ Uyarılar Temizlendi'
      )],
    });
  },
};
