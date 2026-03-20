import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embed.js';

export default {
  category: '🎮 Eğlence',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('ship')
    .setDescription('İki kullanıcıyı eşleştir')
    .addUserOption(o => o.setName('kullanici1').setDescription('Birinci kullanıcı').setRequired(true))
    .addUserOption(o => o.setName('kullanici2').setDescription('İkinci kullanıcı').setRequired(true)),

  async execute(interaction) {
    const u1 = interaction.options.getUser('kullanici1');
    const u2 = interaction.options.getUser('kullanici2');

    if (u1.id === u2.id) {
      return interaction.reply({
        embeds: [createEmbed({ type: 'warning', title: '💘 Ship', description: 'Kendini kendinle eşleştiremezsin!' })],
        ephemeral: true,
      });
    }

    // Deterministik skor
    const seed = (BigInt(u1.id) + BigInt(u2.id)).toString();
    let hash = 0;
    for (const c of seed) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
    const score = Math.abs(hash) % 101;

    // Ship ismi: her iki kullanıcının adının yarısını birleştir
    const name1 = u1.username.slice(0, Math.ceil(u1.username.length / 2));
    const name2 = u2.username.slice(Math.floor(u2.username.length / 2));
    const shipName = name1 + name2;

    const bar = '💗'.repeat(Math.floor(score / 10)) + '🤍'.repeat(10 - Math.floor(score / 10));

    let verdict;
    if (score < 25) verdict = '💔 Pek uyuşmuyorlar';
    else if (score < 50) verdict = '🤔 Belki olur...';
    else if (score < 75) verdict = '😊 İyi bir çift!';
    else if (score < 90) verdict = '💕 Harika uyum!';
    else verdict = '💝 Mükemmel eşleşme!';

    await interaction.reply({
      embeds: [createEmbed({
        type: 'info',
        title: '💘 Ship',
        description: `**${u1.username}** 💞 **${u2.username}**\n\n🚢 Ship adı: **${shipName}**\n\n${bar}\n\n**%${score}** — ${verdict}`,
      })],
    });
  },
};
