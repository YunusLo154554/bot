import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embed.js';

export default {
  category: '🎮 Eğlence',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Yazı mı tura mı?'),

  async execute(interaction) {
    const result = Math.random() < 0.5;
    const embed = createEmbed({
      type: result ? 'success' : 'info',
      title: '🪙 Para Atışı',
      description: result ? '# YAZI' : '# TURA',
      footer: `Atan: ${interaction.user.username}`,
    });

    await interaction.reply({ embeds: [embed] });
  },
};
