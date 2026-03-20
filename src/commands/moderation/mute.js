import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ModerateMembers],
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Kullanıcıyı sustur')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt =>
      opt.setName('kullanici').setDescription('Susturulacak kullanıcı').setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('dakika').setDescription('Süre (dakika)').setRequired(true).setMinValue(1).setMaxValue(1440)
    )
    .addStringOption(opt =>
      opt.setName('sebep').setDescription('Sebep').setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('kullanici');
    const minutes = interaction.options.getInteger('dakika');
    const reason = interaction.options.getString('sebep') ?? 'Sebep belirtilmedi';
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) return interaction.reply({ embeds: [errorEmbed('Kullanıcı bulunamadı.')], ephemeral: true });
    if (!member.moderatable) return interaction.reply({ embeds: [errorEmbed('Bu kullanıcıyı susturamam.')], ephemeral: true });

    await member.timeout(minutes * 60 * 1000, `${interaction.user.username}: ${reason}`);

    await interaction.reply({
      embeds: [successEmbed(
        `**${target.username}** **${minutes} dakika** susturuldu.\n📝 Sebep: ${reason}`,
        '🔇 Mute Uygulandı'
      )],
    });
  },
};
