import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embed.js';

const RESPONSES = [
  { text: 'Kesinlikle evet.', type: 'success' },
  { text: 'Bence evet.', type: 'success' },
  { text: 'Çok muhtemel.', type: 'success' },
  { text: 'İşaretler evet diyor.', type: 'success' },
  { text: 'Evet.', type: 'success' },
  { text: 'Şu an belirsiz, tekrar sor.', type: 'warning' },
  { text: 'Şimdi tahmin edemem.', type: 'warning' },
  { text: 'Konsantre ol ve tekrar sor.', type: 'warning' },
  { text: 'Buna güvenme.', type: 'error' },
  { text: 'Cevabım hayır.', type: 'error' },
  { text: 'Kaynaklar hayır diyor.', type: 'error' },
  { text: 'Pek iyi görünmüyor.', type: 'error' },
  { text: 'Kesinlikle hayır.', type: 'error' },
];

export default {
  category: '🎮 Eğlence',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Sihirli 8 top sana cevap verir')
    .addStringOption(opt =>
      opt.setName('soru').setDescription('Sorun nedir?').setRequired(true)
    ),

  async execute(interaction) {
    const question = interaction.options.getString('soru');
    const response = RESPONSES[Math.floor(Math.random() * RESPONSES.length)];

    const embed = createEmbed({
      type: response.type,
      title: '🎱 Sihirli 8 Top',
      fields: [
        { name: '❓ Soru', value: question },
        { name: '🔮 Cevap', value: response.text },
      ],
      footer: `Soran: ${interaction.user.username}`,
    });

    await interaction.reply({ embeds: [embed] });
  },
};
