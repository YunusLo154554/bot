import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embed.js';

const EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

export default {
  category: '🎮 Eğlence',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Anket oluştur')
    .addStringOption(opt =>
      opt.setName('soru').setDescription('Anket sorusu').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('seçenek1').setDescription('1. seçenek').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('seçenek2').setDescription('2. seçenek').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('seçenek3').setDescription('3. seçenek').setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('seçenek4').setDescription('4. seçenek').setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('seçenek5').setDescription('5. seçenek').setRequired(false)
    ),

  async execute(interaction) {
    const question = interaction.options.getString('soru');
    const options = [
      interaction.options.getString('seçenek1'),
      interaction.options.getString('seçenek2'),
      interaction.options.getString('seçenek3'),
      interaction.options.getString('seçenek4'),
      interaction.options.getString('seçenek5'),
    ].filter(Boolean);

    const fields = options.map((opt, i) => ({
      name: `${EMOJIS[i]} ${opt}`,
      value: '0 oy',
      inline: false,
    }));

    const embed = createEmbed({
      type: 'info',
      title: '📊 ANKET',
      description: question,
      fields,
      footer: `Oluşturan: ${interaction.user.username}`,
    });

    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });

    for (let i = 0; i < options.length; i++) {
      await msg.react(EMOJIS[i]);
    }
  },
};
