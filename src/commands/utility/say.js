import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { errorEmbed } from '../../utils/embed.js';

export default {
  category: '⚙️ Yönetim',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageMessages],
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Bot ağzından mesaj gönder')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(opt =>
      opt.setName('mesaj').setDescription('Gönderilecek mesaj').setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName('kanal').setDescription('Hedef kanal (boş = bu kanal)').setRequired(false)
    ),

  async execute(interaction) {
    const raw = interaction.options.getString('mesaj');
    const channel = interaction.options.getChannel('kanal') ?? interaction.channel;

    // @everyone / @here injection engelle
    const safe = raw.replace(/@(everyone|here)/gi, '@\u200b$1');

    if (!channel.isTextBased()) {
      return interaction.reply({ embeds: [errorEmbed('Metin kanalı seçmelisin.')], ephemeral: true });
    }

    try {
      await channel.send(safe);
      await interaction.reply({ content: '✅ Gönderildi.', ephemeral: true });
    } catch {
      await interaction.reply({ embeds: [errorEmbed('Mesaj gönderilemedi.')], ephemeral: true });
    }
  },
};
