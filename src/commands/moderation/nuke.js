import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';

export default {
  category: '🔨 Moderasyon',
  cooldown: 30,
  permissions: [PermissionFlagsBits.ManageChannels],
  data: new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('Kanalı klonlar ve eskisini siler (tüm mesajlar silinir)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const channel = interaction.channel;
    await interaction.reply({ embeds: [successEmbed('Kanal nuke ediliyor... 💣', '💣 Nuke')], ephemeral: true });

    const clone = await channel.clone({ reason: `Nuke — ${interaction.user.username}` });
    await clone.setPosition(channel.position);
    await channel.delete(`Nuke — ${interaction.user.username}`);

    await clone.send({ embeds: [successEmbed('💥 Kanal nuke edildi.', '💣 Nuke')] });
  },
};
