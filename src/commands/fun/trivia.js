import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { createEmbed, errorEmbed } from '../../utils/embed.js';

const QUESTIONS = [
  { q: 'Türkiye\'nin başkenti neresidir?', correct: 'Ankara', options: ['İstanbul', 'Ankara', 'İzmir', 'Bursa'] },
  { q: 'Güneş sistemimizdeki en büyük gezegen hangisidir?', correct: 'Jüpiter', options: ['Satürn', 'Neptün', 'Jüpiter', 'Uranüs'] },
  { q: 'Su\'nun kimyasal formülü nedir?', correct: 'H₂O', options: ['CO₂', 'H₂O', 'O₂', 'NaCl'] },
  { q: 'Discord hangi yılda kuruldu?', correct: '2015', options: ['2013', '2014', '2015', '2016'] },
  { q: 'Python programlama dili kim tarafından geliştirildi?', correct: 'Guido van Rossum', options: ['Linus Torvalds', 'Dennis Ritchie', 'Guido van Rossum', 'James Gosling'] },
  { q: 'Dünya\'nın en büyük okyanusu hangisidir?', correct: 'Pasifik', options: ['Atlantik', 'Hint', 'Pasifik', 'Arktik'] },
  { q: 'JavaScript\'i kim yarattı?', correct: 'Brendan Eich', options: ['Tim Berners-Lee', 'Brendan Eich', 'Bill Gates', 'Mark Zuckerberg'] },
  { q: 'Bir dakikada kaç saniye vardır?', correct: '60', options: ['30', '60', '100', '120'] },
  { q: 'HTML\'nin açılımı nedir?', correct: 'HyperText Markup Language', options: ['HyperText Markup Language', 'High Tech Modern Language', 'HyperText Modern Links', 'Home Tool Markup Language'] },
  { q: 'Dünyanın en yüksek dağı hangisidir?', correct: 'Everest', options: ['K2', 'Kangchenjunga', 'Everest', 'Lhotse'] },
];

const active = new Map(); // userId -> timeout

export default {
  category: '🎮 Eğlence',
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('Bilgi yarışması sorusu'),

  async execute(interaction) {
    if (active.has(interaction.user.id)) {
      return interaction.reply({ embeds: [errorEmbed('Zaten aktif bir sorun var.')], ephemeral: true });
    }

    const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    const shuffled = [...q.options].sort(() => Math.random() - 0.5);
    const labels = ['A', 'B', 'C', 'D'];

    const row = new ActionRowBuilder().addComponents(
      shuffled.map((opt, i) =>
        new ButtonBuilder()
          .setCustomId(`trivia_${i}`)
          .setLabel(`${labels[i]}) ${opt}`)
          .setStyle(ButtonStyle.Secondary)
      )
    );

    const msg = await interaction.reply({
      embeds: [createEmbed({
        type: 'info',
        title: '🧠 Bilgi Yarışması',
        description: `**${q.q}**`,
        footer: '30 saniye içinde cevapla!',
      })],
      components: [row],
      fetchReply: true,
    });

    const timeout = setTimeout(() => {
      active.delete(interaction.user.id);
      msg.edit({
        embeds: [createEmbed({ type: 'error', title: '⏰ Süre Doldu!', description: `Doğru cevap: **${q.correct}**` })],
        components: [],
      }).catch(() => null);
    }, 30_000);

    active.set(interaction.user.id, timeout);

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id && i.customId.startsWith('trivia_'),
      time: 30_000,
      max: 1,
    });

    collector.on('collect', async i => {
      clearTimeout(active.get(interaction.user.id));
      active.delete(interaction.user.id);

      const idx = parseInt(i.customId.split('_')[1]);
      const chosen = shuffled[idx];
      const correct = chosen === q.correct;

      await i.update({
        embeds: [createEmbed({
          type: correct ? 'success' : 'error',
          title: correct ? '✅ Doğru!' : '❌ Yanlış!',
          description: correct
            ? `**${q.q}**\n\nDoğru cevap: **${q.correct}** 🎉`
            : `**${q.q}**\n\nSeçtiğin: **${chosen}**\nDoğru cevap: **${q.correct}**`,
        })],
        components: [],
      });
    });
  },
};
