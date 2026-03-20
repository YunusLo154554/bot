import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embed.js';

export default {
  category: '🎮 Eğlence',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Zar atar')
    .addIntegerOption(opt =>
      opt.setName('max').setDescription('Maksimum değer (varsayılan: 6)').setMinValue(2).setMaxValue(1000)
    ),

  async execute(interaction) {
    const max = interaction.options.getInteger('max') ?? 6;
    const result = Math.floor(Math.random() * max) + 1;

    await interaction.reply({
      embeds: [createEmbed({
        type: 'info',
        title: '🎲 Zar Atışı',
        description: `**1–${max}** arasında: # ${result}`,
        footer: `Atan: ${interaction.user.username}`,
      })],
    });
  },
};
