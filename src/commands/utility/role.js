import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';

export default {
  category: '⚙️ Yönetim',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageRoles],
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Kullanıcıya rol ver/al')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(opt =>
      opt.setName('kullanici').setDescription('Kullanıcı').setRequired(true)
    )
    .addRoleOption(opt =>
      opt.setName('rol').setDescription('Rol').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('işlem').setDescription('Ver veya Al').setRequired(true)
      .addChoices(
        { name: 'Ver', value: 'add' },
        { name: 'Al', value: 'remove' }
      )
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('kullanici');
    const role = interaction.options.getRole('rol');
    const action = interaction.options.getString('işlem');

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) return interaction.reply({ embeds: [errorEmbed('Kullanıcı bulunamadı.')], ephemeral: true });

    try {
      if (action === 'add') {
        await member.roles.add(role);
        await interaction.reply({
          embeds: [successEmbed(`**${target.username}** → **${role.name}** rolü verildi.`)],
        });
      } else {
        await member.roles.remove(role);
        await interaction.reply({
          embeds: [successEmbed(`**${target.username}** → **${role.name}** rolü alındı.`)],
        });
      }
    } catch (err) {
      await interaction.reply({
        embeds: [errorEmbed(`Rol işlemi başarısız: ${err.message}`)],
        ephemeral: true,
      });
    }
  },
};
