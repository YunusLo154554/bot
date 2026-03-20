import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { createEmbed } from '../../utils/embed.js';

const ANIMALS = [
  { name: 'Aslan', emoji: '🦁', hint: 'Ormanların kralı', options: ['Kaplan', 'Aslan', 'Leopar', 'Çita'] },
  { name: 'Penguen', emoji: '🐧', hint: 'Uçamayan, yüzebilen kuş', options: ['Penguen', 'Ördek', 'Martı', 'Pelikan'] },
  { name: 'Kanguru', emoji: '🦘', hint: 'Avustralya\'ya özgü, yavrusunu kesesinde taşır', options: ['Koala', 'Vombat', 'Kanguru', 'Keseli sıçan'] },
  { name: 'Ahtapot', emoji: '🐙', hint: '8 kolu olan deniz canlısı', options: ['Ahtapot', 'Kalamar', 'Yengeç', 'Istakoz'] },
  { name: 'Zürafа', emoji: '🦒', hint: 'Dünyanın en uzun boyunlu hayvanı', options: ['Fil', 'Zürafa', 'Deve', 'At'] },
  { name: 'Timsah', emoji: '🐊', hint: 'Sürüngen, hem karada hem suda yaşar', options: ['Kertenkele', 'Timsah', 'Yılan', 'Kaplumbağa'] },
  { name: 'Kartal', emoji: '🦅', hint: 'Gökyüzünün hükümdarı', options: ['Kartal', 'Şahin', 'Akbaba', 'Baykuş'] },
];

const active = new Map();

export default {
  category: '🎮 Eğlence',
  cooldown: 8,
  data: new SlashCommandBuilder()
    .setName('animalquiz')
    .setDescription('Hayvan bilmece oyunu'),

  async execute(interaction) {
    if (active.has(interaction.user.id)) {
      return interaction.reply({ content: 'Zaten aktif bir sorun var!', ephemeral: true });
    }

    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const shuffled = [...animal.options].sort(() => Math.random() - 0.5);

    const row = new ActionRowBuilder().addComponents(
      shuffled.map((opt, i) =>
        new ButtonBuilder()
          .setCustomId(`aq_${i}`)
          .setLabel(opt)
          .setStyle(ButtonStyle.Secondary)
      )
    );

    active.set(interaction.user.id, true);

    const msg = await interaction.reply({
      embeds: [createEmbed({
        type: 'info',
        title: '🐾 Hayvan Bilmece',
        description: `**İpucu:** ${animal.hint}\n\nBu hangi hayvan?`,
        footer: '20 saniye içinde cevapla!',
      })],
      components: [row],
      fetchReply: true,
    });

    const timeout = setTimeout(() => {
      active.delete(interaction.user.id);
      msg.edit({
        embeds: [createEmbed({ type: 'error', title: '⏰ Süre Doldu!', description: `Cevap: **${animal.emoji} ${animal.name}**` })],
        components: [],
      }).catch(() => null);
    }, 20_000);

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id && i.customId.startsWith('aq_'),
      time: 20_000,
      max: 1,
    });

    collector.on('collect', async i => {
      clearTimeout(timeout);
      active.delete(interaction.user.id);
      const chosen = shuffled[parseInt(i.customId.split('_')[1])];
      const correct = chosen === animal.name;

      await i.update({
        embeds: [createEmbed({
          type: correct ? 'success' : 'error',
          title: correct ? `✅ Doğru! ${animal.emoji}` : `❌ Yanlış!`,
          description: correct
            ? `Bu bir **${animal.name}**! Tebrikler 🎉`
            : `Seçtiğin: **${chosen}**\nDoğru cevap: **${animal.emoji} ${animal.name}**`,
        })],
        components: [],
      });
    });
  },
};
