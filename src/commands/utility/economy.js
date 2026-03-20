import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, errorEmbed, successEmbed, infoEmbed } from '../../utils/embed.js';

// userId_guildId -> { balance, bank, lastDaily, lastWork }
export const economyData = new Map();

function getEco(userId, guildId) {
  const key = `${userId}_${guildId}`;
  if (!economyData.has(key)) economyData.set(key, { balance: 0, bank: 0, lastDaily: 0, lastWork: 0 });
  return economyData.get(key);
}

const WORK_RESPONSES = [
  'Yazılım geliştirdin', 'Sunucu yönetimi yaptın', 'Grafik tasarım işi aldın',
  'Freelance proje teslim ettin', 'Bot yazdın', 'Veri analizi yaptın',
];

export default {
  category: '💰 Ekonomi',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('economy')
    .setDescription('Ekonomi sistemi')
    .addSubcommand(s => s.setName('bakiye').setDescription('Bakiyeni gör').addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(false)))
    .addSubcommand(s => s.setName('gunluk').setDescription('Günlük ödülünü al'))
    .addSubcommand(s => s.setName('calis').setDescription('Para kazan (1 saatte bir)'))
    .addSubcommand(s =>
      s.setName('transfer')
        .setDescription('Para gönder')
        .addUserOption(o => o.setName('kullanici').setDescription('Alıcı').setRequired(true))
        .addIntegerOption(o => o.setName('miktar').setDescription('Miktar').setRequired(true).setMinValue(1))
    )
    .addSubcommand(s =>
      s.setName('yatir')
        .setDescription('Bankaya para yatır')
        .addIntegerOption(o => o.setName('miktar').setDescription('Miktar (all = hepsi)').setRequired(false).setMinValue(1))
    )
    .addSubcommand(s =>
      s.setName('cek')
        .setDescription('Bankadan para çek')
        .addIntegerOption(o => o.setName('miktar').setDescription('Miktar').setRequired(false).setMinValue(1))
    )
    .addSubcommand(s => s.setName('top').setDescription('Zenginler sıralaması')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;
    const uid = interaction.user.id;

    if (sub === 'bakiye') {
      const target = interaction.options.getUser('kullanici') ?? interaction.user;
      const eco = getEco(target.id, gid);
      return interaction.reply({
        embeds: [createEmbed({
          type: 'info',
          title: `💰 ${target.username} — Bakiye`,
          thumbnail: target.displayAvatarURL(),
          fields: [
            { name: '👛 Cüzdan', value: `${eco.balance} 🪙`, inline: true },
            { name: '🏦 Banka', value: `${eco.bank} 🪙`, inline: true },
            { name: '💎 Toplam', value: `${eco.balance + eco.bank} 🪙`, inline: true },
          ],
        })],
      });
    }

    if (sub === 'gunluk') {
      const eco = getEco(uid, gid);
      const now = Date.now();
      const cooldown = 86400000; // 24 saat
      if (now - eco.lastDaily < cooldown) {
        const remaining = Math.ceil((cooldown - (now - eco.lastDaily)) / 3600000);
        return interaction.reply({ embeds: [errorEmbed(`Günlük ödülünü zaten aldın. **${remaining}** saat sonra tekrar dene.`)], ephemeral: true });
      }
      const reward = Math.floor(Math.random() * 200) + 100;
      eco.balance += reward;
      eco.lastDaily = now;
      return interaction.reply({ embeds: [successEmbed(`Günlük ödülün: **${reward} 🪙**\nYeni bakiye: **${eco.balance} 🪙**`, '🎁 Günlük Ödül')] });
    }

    if (sub === 'calis') {
      const eco = getEco(uid, gid);
      const now = Date.now();
      const cooldown = 3600000; // 1 saat
      if (now - eco.lastWork < cooldown) {
        const remaining = Math.ceil((cooldown - (now - eco.lastWork)) / 60000);
        return interaction.reply({ embeds: [errorEmbed(`Çok yoruldun. **${remaining}** dakika sonra tekrar çalış.`)], ephemeral: true });
      }
      const earned = Math.floor(Math.random() * 100) + 50;
      eco.balance += earned;
      eco.lastWork = now;
      const job = WORK_RESPONSES[Math.floor(Math.random() * WORK_RESPONSES.length)];
      return interaction.reply({ embeds: [successEmbed(`${job} ve **${earned} 🪙** kazandın!\nBakiye: **${eco.balance} 🪙**`, '💼 Çalışma')] });
    }

    if (sub === 'transfer') {
      const target = interaction.options.getUser('kullanici');
      const amount = interaction.options.getInteger('miktar');
      if (target.id === uid) return interaction.reply({ embeds: [errorEmbed('Kendine para gönderemezsin.')], ephemeral: true });
      const senderEco = getEco(uid, gid);
      if (senderEco.balance < amount) return interaction.reply({ embeds: [errorEmbed(`Yetersiz bakiye. Cüzdanında: **${senderEco.balance} 🪙**`)], ephemeral: true });
      senderEco.balance -= amount;
      getEco(target.id, gid).balance += amount;
      return interaction.reply({ embeds: [successEmbed(`**${target.username}**'e **${amount} 🪙** gönderildi.`, '💸 Transfer')] });
    }

    if (sub === 'yatir') {
      const eco = getEco(uid, gid);
      const amount = interaction.options.getInteger('miktar') ?? eco.balance;
      if (eco.balance < amount) return interaction.reply({ embeds: [errorEmbed('Yetersiz bakiye.')], ephemeral: true });
      eco.balance -= amount;
      eco.bank += amount;
      return interaction.reply({ embeds: [successEmbed(`**${amount} 🪙** bankaya yatırıldı.\n🏦 Banka: **${eco.bank} 🪙**`)] });
    }

    if (sub === 'cek') {
      const eco = getEco(uid, gid);
      const amount = interaction.options.getInteger('miktar') ?? eco.bank;
      if (eco.bank < amount) return interaction.reply({ embeds: [errorEmbed('Bankada yeterli para yok.')], ephemeral: true });
      eco.bank -= amount;
      eco.balance += amount;
      return interaction.reply({ embeds: [successEmbed(`**${amount} 🪙** bankadan çekildi.\n👛 Cüzdan: **${eco.balance} 🪙**`)] });
    }

    if (sub === 'top') {
      const entries = [...economyData.entries()]
        .filter(([k]) => k.endsWith(`_${gid}`))
        .map(([k, d]) => ({ uid: k.split('_')[0], total: d.balance + d.bank }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      if (!entries.length) return interaction.reply({ embeds: [infoEmbed('Henüz veri yok.', '💰 Zenginler')] });

      const medals = ['🥇', '🥈', '🥉'];
      const list = entries.map((e, i) => `${medals[i] ?? `**${i + 1}.**`} <@${e.uid}> — **${e.total} 🪙**`).join('\n');
      return interaction.reply({ embeds: [createEmbed({ type: 'info', title: '💰 Zenginler Sıralaması', description: list })] });
    }
  },
};
