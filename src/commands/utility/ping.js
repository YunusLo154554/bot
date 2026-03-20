import { SlashCommandBuilder } from 'discord.js';
import { infoEmbed } from '../../utils/embed.js';

export default {
  category: '⚙️ Yönetim',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Bot gecikme süresini gösterir'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: 'Ölçülüyor...', fetchReply: true });
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;

    await interaction.editReply({
      content: '',
      embeds: [
        infoEmbed(
          `🏓 **Roundtrip:** ${roundtrip}ms\n💓 **WebSocket:** ${interaction.client.ws.ping}ms`,
          'Pong!'
        ),
      ],
    });
  },
};
