import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  permissions: [PermissionFlagsBits.BanMembers],
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Kullanıcının yasağını kaldır')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(opt =>
      opt.setName('userid').setDescription('Kullanıcı ID').setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.options.getString('userid');

    try {
      await interaction.guild.bans.remove(userId);

      await interaction.reply({
        embeds: [successEmbed(`Kullanıcı **${userId}** yasağı kaldırıldı.`, '✅ Unban')],
      });
    } catch (err) {
      await interaction.reply({
        embeds: [errorEmbed(`Hata: ${err.message}`)],
        ephemeral: true,
      });
    }
  },
};
