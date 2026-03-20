import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embed.js';

export default {
  category: '⚙️ Yönetim',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Kullanıcının avatarını gösterir')
    .addUserOption(opt =>
      opt.setName('kullanici').setDescription('Kullanıcı').setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('kullanici') ?? interaction.user;
    const url = target.displayAvatarURL({ dynamic: true, size: 1024 });

    const embed = createEmbed({
      type: 'neutral',
      title: `${target.username} — Avatar`,
    }).setImage(url);

    await interaction.reply({ embeds: [embed] });
  },
};
