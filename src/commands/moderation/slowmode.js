import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageChannels],
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Kanal slowmode\'unu ayarla')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(opt =>
      opt.setName('saniye').setDescription('Saniye (0 = kapat)').setRequired(true).setMinValue(0).setMaxValue(21600)
    ),

  async execute(interaction) {
    const seconds = interaction.options.getInteger('saniye');

    try {
      await interaction.channel.setRateLimitPerUser(seconds);

      const message = seconds === 0
        ? 'Slowmode kapatıldı.'
        : `Slowmode **${seconds} saniye** olarak ayarlandı.`;

      await interaction.reply({
        embeds: [successEmbed(message, '⏱️ Slowmode')],
      });
    } catch (err) {
      await interaction.reply({
        embeds: [errorEmbed(`Hata: ${err.message}`)],
        ephemeral: true,
      });
    }
  },
};
