import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ModerateMembers],
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Kullanıcının susturmasını kaldır')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt =>
      opt.setName('kullanici').setDescription('Kullanıcı').setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('kullanici');
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) return interaction.reply({ embeds: [errorEmbed('Kullanıcı bulunamadı.')], ephemeral: true });
    if (!member.moderatable) return interaction.reply({ embeds: [errorEmbed('Bu kullanıcıyı yönetemem.')], ephemeral: true });

    await member.timeout(null);

    await interaction.reply({
      embeds: [successEmbed(`**${target.username}** susturması kaldırıldı.`, '🔊 Unmute')],
    });
  },
};
