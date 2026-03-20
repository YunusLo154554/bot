import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embed.js';

export default {
  category: '🎮 Eğlence',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('choose')
    .setDescription('Seçenekler arasından rastgele seç')
    .addStringOption(opt =>
      opt.setName('seçenekler').setDescription('Virgülle ayır: elma, armut, muz').setRequired(true)
    ),

  async execute(interaction) {
    const raw = interaction.options.getString('seçenekler');
    const choices = raw.split(',').map(s => s.trim()).filter(Boolean);

    if (choices.length < 2) {
      return interaction.reply({
        embeds: [createEmbed({ type: 'error', title: '❌ Hata', description: 'En az 2 seçenek gir (virgülle ayır).' })],
        ephemeral: true,
      });
    }

    const winner = choices[Math.floor(Math.random() * choices.length)];

    await interaction.reply({
      embeds: [createEmbed({
        type: 'success',
        title: '🎯 Seçim Yapıldı',
        fields: [
          { name: '📋 Seçenekler', value: choices.map((c, i) => `${i + 1}. ${c}`).join('\n'), inline: false },
          { name: '✅ Seçilen', value: `**${winner}**`, inline: false },
        ],
        footer: `Soran: ${interaction.user.username}`,
      })],
    });
  },
};
