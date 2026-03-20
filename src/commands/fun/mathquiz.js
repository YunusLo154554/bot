import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, errorEmbed } from '../../utils/embed.js';

const active = new Map(); // userId -> { answer, timeout }

function generate(difficulty) {
  const max = difficulty === 'kolay' ? 20 : difficulty === 'orta' ? 100 : 500;
  const ops = difficulty === 'zor' ? ['+', '-', '*', '/'] : ['+', '-', '*'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = Math.floor(Math.random() * max) + 1;
  let b = Math.floor(Math.random() * max) + 1;

  if (op === '/') {
    b = Math.floor(Math.random() * 10) + 1;
    a = b * (Math.floor(Math.random() * 10) + 1);
  }

  const answer = op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b;
  return { question: `${a} ${op} ${b}`, answer };
}

export default {
  category: '🎮 Eğlence',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('mathquiz')
    .setDescription('Matematik sorusu çöz')
    .addStringOption(o =>
      o.setName('zorluk').setDescription('Zorluk seviyesi').setRequired(false)
        .addChoices(
          { name: 'Kolay', value: 'kolay' },
          { name: 'Orta', value: 'orta' },
          { name: 'Zor', value: 'zor' },
        )
    ),

  async execute(interaction) {
    if (active.has(interaction.user.id)) {
      return interaction.reply({ embeds: [errorEmbed('Zaten aktif bir sorun var. Önce onu cevapla.')], ephemeral: true });
    }

    const difficulty = interaction.options.getString('zorluk') ?? 'orta';
    const { question, answer } = generate(difficulty);

    const timeout = setTimeout(() => {
      active.delete(interaction.user.id);
    }, 30_000);

    active.set(interaction.user.id, { answer, timeout });

    await interaction.reply({
      embeds: [createEmbed({
        type: 'info',
        title: '🔢 Matematik Sorusu',
        description: `**${question} = ?**`,
        fields: [{ name: '⏱️ Süre', value: '30 saniye', inline: true }, { name: '📊 Zorluk', value: difficulty, inline: true }],
        footer: 'Cevabını bu kanala yaz!',
      })],
    });

    const collector = interaction.channel.createMessageCollector({
      filter: m => m.author.id === interaction.user.id,
      time: 30_000,
    });

    collector.on('collect', async m => {
      const game = active.get(interaction.user.id);
      if (!game) return collector.stop();

      const userAnswer = parseFloat(m.content.trim());
      if (isNaN(userAnswer)) return;

      clearTimeout(game.timeout);
      active.delete(interaction.user.id);
      collector.stop();

      const correct = Math.abs(userAnswer - game.answer) < 0.01;
      await m.reply({
        embeds: [createEmbed({
          type: correct ? 'success' : 'error',
          title: correct ? '✅ Doğru!' : '❌ Yanlış!',
          description: correct
            ? `**${question} = ${answer}** — Tebrikler! 🎉`
            : `**${question} = ${answer}**\nSenin cevabın: ${userAnswer}`,
        })],
      });
    });

    collector.on('end', (_, reason) => {
      if (reason === 'time') {
        const game = active.get(interaction.user.id);
        if (game) { clearTimeout(game.timeout); active.delete(interaction.user.id); }
        interaction.followUp({
          embeds: [createEmbed({ type: 'error', title: '⏰ Süre Doldu!', description: `Doğru cevap: **${answer}**` })],
        }).catch(() => null);
      }
    });
  },
};
