import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, infoEmbed } from '../../utils/embed.js';
import { levelData } from './level.js';
import { economyData } from './economy.js';

const ACHIEVEMENTS = [
  { id: 'first_msg', name: '📝 İlk Mesaj', desc: 'İlk mesajını gönder', check: (s) => (s.messages ?? 0) >= 1 },
  { id: 'chatterbox', name: '💬 Geveze', desc: '100 mesaj gönder', check: (s) => (s.messages ?? 0) >= 100 },
  { id: 'talkative', name: '🗣️ Konuşkan', desc: '1000 mesaj gönder', check: (s) => (s.messages ?? 0) >= 1000 },
  { id: 'level5', name: '⭐ Çaylak', desc: 'Seviye 5\'e ulaş', check: (s) => (s.level ?? 0) >= 5 },
  { id: 'level10', name: '🌟 Deneyimli', desc: 'Seviye 10\'a ulaş', check: (s) => (s.level ?? 0) >= 10 },
  { id: 'level25', name: '💫 Uzman', desc: 'Seviye 25\'e ulaş', check: (s) => (s.level ?? 0) >= 25 },
  { id: 'rich100', name: '🪙 Başlangıç', desc: '100 coin biriktir', check: (s) => (s.balance ?? 0) >= 100 },
  { id: 'rich1000', name: '💰 Zengin', desc: '1000 coin biriktir', check: (s) => (s.balance ?? 0) >= 1000 },
  { id: 'rich10000', name: '👑 Milyoner', desc: '10000 coin biriktir', check: (s) => (s.balance ?? 0) >= 10000 },
];

export default {
  category: '🏆 Başarımlar',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('achievements')
    .setDescription('Başarım sistemini görüntüle')
    .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı (boş = sen)').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('kullanici') ?? interaction.user;
    const gid = interaction.guild.id;
    const key = `${target.id}_${gid}`;

    const lvl = levelData.get(key) ?? { level: 0, xp: 0 };
    const eco = economyData.get(key) ?? { balance: 0, bank: 0 };

    // Mesaj sayısını stats'tan al (basit yaklaşım)
    const stats = { messages: 0, level: lvl.level, balance: eco.balance + eco.bank };

    const earned = ACHIEVEMENTS.filter(a => a.check(stats));
    const locked = ACHIEVEMENTS.filter(a => !a.check(stats));

    const earnedStr = earned.length
      ? earned.map(a => `${a.name} — *${a.desc}*`).join('\n')
      : 'Henüz başarım yok.';

    const lockedStr = locked.slice(0, 5).map(a => `🔒 ~~${a.name}~~ — *${a.desc}*`).join('\n');

    await interaction.reply({
      embeds: [createEmbed({
        type: 'info',
        title: `🏆 ${target.username} — Başarımlar`,
        thumbnail: target.displayAvatarURL(),
        fields: [
          { name: `✅ Kazanılan (${earned.length}/${ACHIEVEMENTS.length})`, value: earnedStr, inline: false },
          { name: '🔒 Kilitli (ilk 5)', value: lockedStr || 'Hepsi tamamlandı!', inline: false },
        ],
      })],
    });
  },
};
