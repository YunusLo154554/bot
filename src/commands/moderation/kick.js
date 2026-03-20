import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  permissions: [PermissionFlagsBits.KickMembers],
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Bir kullanıcıyı sunucudan atar')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(opt =>
      opt.setName('kullanici').setDescription('Atılacak kullanıcı').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('sebep').setDescription('Atma sebebi').setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('kullanici');
    const reason = interaction.options.getString('sebep') ?? 'Sebep belirtilmedi';
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) return interaction.reply({ embeds: [errorEmbed('Kullanıcı bulunamadı.')], ephemeral: true });
    if (!member.kickable) return interaction.reply({ embeds: [errorEmbed('Bu kullanıcıyı atamam.')], ephemeral: true });
    if (member.id === interaction.user.id) return interaction.reply({ embeds: [errorEmbed('Kendini atamazsın.')], ephemeral: true });

    await member.kick(`${interaction.user.username}: ${reason}`);

    await interaction.reply({
      embeds: [successEmbed(`**${target.username}** sunucudan atıldı.\n📝 Sebep: ${reason}`, '👢 Kullanıcı Atıldı')],
    });
  },
};
