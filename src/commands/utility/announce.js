import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed, successEmbed, errorEmbed } from '../../utils/embed.js';

export default {
  category: '⚙️ Yönetim',
  cooldown: 10,
  permissions: [PermissionFlagsBits.ManageMessages],
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Duyuru yap')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(opt =>
      opt.setName('başlık').setDescription('Duyuru başlığı').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('içerik').setDescription('Duyuru içeriği').setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName('kanal').setDescription('Duyuru yapılacak kanal').setRequired(false)
    ),

  async execute(interaction) {
    const title = interaction.options.getString('başlık');
    const content = interaction.options.getString('içerik');
    const channel = interaction.options.getChannel('kanal') ?? interaction.channel;

    if (!channel.isTextBased()) {
      return interaction.reply({
        embeds: [errorEmbed('Metin kanalı seçmelisin.')],
        ephemeral: true,
      });
    }

    const embed = createEmbed({
      type: 'info',
      title: `📢 ${title}`,
      description: content,
      footer: `Duyuran: ${interaction.user.username}`,
    });

    try {
      await channel.send({ embeds: [embed] });
      await interaction.reply({
        embeds: [successEmbed(`Duyuru **${channel}** kanalına gönderildi.`)],
        ephemeral: true,
      });
    } catch (err) {
      await interaction.reply({
        embeds: [errorEmbed(`Duyuru gönderilemedi: ${err.message}`)],
        ephemeral: true,
      });
    }
  },
};
