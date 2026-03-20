import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageChannels],
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Kanalın kilidini aç')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    try {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
        SendMessages: null,
      });

      await interaction.reply({
        embeds: [successEmbed('Kanal kilidi açıldı.', '🔓 Kanal Açık')],
      });
    } catch (err) {
      await interaction.reply({
        embeds: [errorEmbed(`Hata: ${err.message}`)],
        ephemeral: true,
      });
    }
  },
};
