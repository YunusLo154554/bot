import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embed.js';

function loveScore(id1, id2) {
  // Deterministik ama rastgele görünen skor — aynı çift her zaman aynı sonucu alır
  const seed = (BigInt(id1) ^ BigInt(id2)).toString();
  let hash = 0;
  for (const c of seed) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return Math.abs(hash) % 101;
}

const HEARTS = ['💔', '❤️‍🩹', '🧡', '💛', '💚', '💙', '💜', '❤️', '💖', '💗', '💝'];

export default {
  category: '🎮 Eğlence',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('love')
    .setDescription('İki kullanıcı arasındaki aşk oranını hesapla')
    .addUserOption(o => o.setName('kullanici1').setDescription('Birinci kullanıcı').setRequired(true))
    .addUserOption(o => o.setName('kullanici2').setDescription('İkinci kullanıcı (boş = sen)').setRequired(false)),

  async execute(interaction) {
    const u1 = interaction.options.getUser('kullanici1');
    const u2 = interaction.options.getUser('kullanici2') ?? interaction.user;

    const score = loveScore(u1.id, u2.id);
    const heartIdx = Math.floor(score / 10);
    const heart = HEARTS[Math.min(heartIdx, HEARTS.length - 1)];
    const bar = '█'.repeat(Math.floor(score / 10)) + '░'.repeat(10 - Math.floor(score / 10));

    let comment;
    if (score < 20) comment = 'Hiç uyuşmuyorlar 😬';
    else if (score < 40) comment = 'Biraz potansiyel var...';
    else if (score < 60) comment = 'Fena değil! 😊';
    else if (score < 80) comment = 'Çok iyi gidiyorlar! 💕';
    else if (score < 95) comment = 'Mükemmel bir çift! 💖';
    else comment = 'Evrenin en uyumlu çifti! 💝✨';

    await interaction.reply({
      embeds: [createEmbed({
        type: 'info',
        title: `${heart} Aşk Ölçer`,
        description: `**${u1.username}** & **${u2.username}**\n\n\`[${bar}]\` **%${score}**\n\n${comment}`,
      })],
    });
  },
};
