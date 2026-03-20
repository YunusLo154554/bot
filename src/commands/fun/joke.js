import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embed.js';

const JOKES = [
  { setup: 'Programcı neden güneşe çıkmaz?', punchline: 'Çünkü Windows var, curtain yok.' },
  { setup: 'Bir yazılımcı markete gider. Karısı der ki: "Bir ekmek al, yumurta varsa 6 tane al."', punchline: 'Yazılımcı 6 ekmek alır. Yumurta vardı.' },
  { setup: 'Neden JavaScript geliştiricileri gözlük takar?', punchline: 'Çünkü C# göremezler.' },
  { setup: 'Bir null pointer neden terapiste gider?', punchline: 'Çünkü referans sorunları var.' },
  { setup: 'Git commit mesajı nasıl olur?', punchline: '"düzelttim", "tekrar düzelttim", "neden çalışmıyor", "ÇALIŞIYOR DOKUNMAYINNN"' },
  { setup: 'Yazılımcı neden evlenmez?', punchline: 'Çünkü relationship\'lerde foreign key sorunları çıkıyor.' },
  { setup: 'Kaç tane yazılımcı lazım ampul değiştirmek için?', punchline: 'Hiç. Bu bir donanım problemi.' },
  { setup: 'Bir yazılımcı neden yemek yapmayı sever?', punchline: 'Çünkü tarif = algoritma.' },
  { setup: 'HTTP 418 nedir?', punchline: 'I\'m a teapot. Gerçekten var, Google\'a sor.' },
  { setup: 'Recursive fonksiyon neden terapiste gider?', punchline: 'Kendini çağırmaktan bıkmış.' },
];

export default {
  category: '🎮 Eğlence',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Rastgele bir yazılım şakası'),

  async execute(interaction) {
    const joke = JOKES[Math.floor(Math.random() * JOKES.length)];

    await interaction.reply({
      embeds: [createEmbed({
        type: 'info',
        title: '😄 Şaka',
        fields: [
          { name: '❓', value: joke.setup, inline: false },
          { name: '💡', value: `||${joke.punchline}||`, inline: false },
        ],
        footer: 'Cevabı görmek için üzerine tıkla',
      })],
    });
  },
};
