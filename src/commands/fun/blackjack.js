import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { createEmbed, errorEmbed } from '../../utils/embed.js';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function newDeck() {
  const deck = [];
  for (const s of SUITS) for (const v of VALUES) deck.push({ s, v });
  return deck.sort(() => Math.random() - 0.5);
}

function cardValue(card) {
  if (['J', 'Q', 'K'].includes(card.v)) return 10;
  if (card.v === 'A') return 11;
  return parseInt(card.v);
}

function handTotal(hand) {
  let total = hand.reduce((s, c) => s + cardValue(c), 0);
  let aces = hand.filter(c => c.v === 'A').length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function handStr(hand, hideSecond = false) {
  return hand.map((c, i) => (hideSecond && i === 1) ? '🂠' : `${c.v}${c.s}`).join(' ');
}

// Active games: userId -> { deck, player, dealer, bet }
const games = new Map();

export default {
  category: '🎮 Eğlence',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Blackjack oyna')
    .addIntegerOption(o => o.setName('bahis').setDescription('Bahis miktarı (1-1000)').setRequired(false).setMinValue(1).setMaxValue(1000)),

  async execute(interaction) {
    if (games.has(interaction.user.id)) {
      return interaction.reply({ embeds: [errorEmbed('Zaten aktif bir oyunun var.')], ephemeral: true });
    }

    const bet = interaction.options.getInteger('bahis') ?? 100;
    const deck = newDeck();
    const player = [deck.pop(), deck.pop()];
    const dealer = [deck.pop(), deck.pop()];

    games.set(interaction.user.id, { deck, player, dealer, bet });

    const playerTotal = handTotal(player);
    const dealerVisible = cardValue(dealer[0]);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('bj_hit').setLabel('🃏 Kart Çek').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('bj_stand').setLabel('✋ Dur').setStyle(ButtonStyle.Secondary),
    );

    // Blackjack kontrolü
    if (playerTotal === 21) {
      games.delete(interaction.user.id);
      return interaction.reply({
        embeds: [createEmbed({
          type: 'success',
          title: '🃏 BLACKJACK!',
          description: `Senin elin: ${handStr(player)} = **21**\nKazandın! 🎉`,
        })],
      });
    }

    await interaction.reply({
      embeds: [createEmbed({
        type: 'info',
        title: '🃏 Blackjack',
        fields: [
          { name: '🤖 Krupiye', value: `${dealer[0].v}${dealer[0].s} 🂠 = ${dealerVisible}+?`, inline: true },
          { name: '👤 Senin Elin', value: `${handStr(player)} = **${playerTotal}**`, inline: true },
          { name: '💰 Bahis', value: `${bet}`, inline: true },
        ],
        footer: 'Kart çek veya dur',
      })],
      components: [row],
    });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id && ['bj_hit', 'bj_stand'].includes(i.customId),
      time: 60_000,
    });

    collector.on('collect', async i => {
      const game = games.get(i.user.id);
      if (!game) return collector.stop();

      if (i.customId === 'bj_hit') {
        game.player.push(game.deck.pop());
        const total = handTotal(game.player);

        if (total > 21) {
          games.delete(i.user.id);
          collector.stop();
          return i.update({
            embeds: [createEmbed({
              type: 'error',
              title: '💥 Battın!',
              description: `Elin: ${handStr(game.player)} = **${total}**\nKrupiye: ${handStr(game.dealer)}\nBahsin: ${bet} kaybedildi.`,
            })],
            components: [],
          });
        }

        if (total === 21) {
          // Otomatik dur
          i.customId = 'bj_stand';
        } else {
          return i.update({
            embeds: [createEmbed({
              type: 'info',
              title: '🃏 Blackjack',
              fields: [
                { name: '🤖 Krupiye', value: `${game.dealer[0].v}${game.dealer[0].s} 🂠`, inline: true },
                { name: '👤 Senin Elin', value: `${handStr(game.player)} = **${total}**`, inline: true },
              ],
            })],
            components: [row],
          });
        }
      }

      if (i.customId === 'bj_stand') {
        const g = games.get(i.user.id);
        games.delete(i.user.id);
        collector.stop();

        // Krupiye 17'ye kadar çeker
        while (handTotal(g.dealer) < 17) g.dealer.push(g.deck.pop());

        const pTotal = handTotal(g.player);
        const dTotal = handTotal(g.dealer);
        let result, type;

        if (dTotal > 21 || pTotal > dTotal) { result = `Kazandın! +${bet} 🎉`; type = 'success'; }
        else if (pTotal === dTotal) { result = 'Berabere! Bahis iade.'; type = 'warning'; }
        else { result = `Kaybettin! -${bet} 😢`; type = 'error'; }

        return i.update({
          embeds: [createEmbed({
            type,
            title: '🃏 Blackjack Sonucu',
            fields: [
              { name: '🤖 Krupiye', value: `${handStr(g.dealer)} = **${dTotal}**`, inline: true },
              { name: '👤 Sen', value: `${handStr(g.player)} = **${pTotal}**`, inline: true },
              { name: '📊 Sonuç', value: result, inline: false },
            ],
          })],
          components: [],
        });
      }
    });

    collector.on('end', (_, reason) => {
      if (reason === 'time') games.delete(interaction.user.id);
    });
  },
};
