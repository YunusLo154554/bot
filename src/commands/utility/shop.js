import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, successEmbed, errorEmbed } from '../../utils/embed.js';
import { economyData } from './economy.js';
import { addItem } from './inventory.js';

const SHOP_ITEMS = [
  { id: 'vip_badge', name: 'VIP Rozeti', emoji: '⭐', price: 500, description: 'Profilinde parlayan VIP rozeti' },
  { id: 'lucky_charm', name: 'Şans Tılsımı', emoji: '🍀', price: 250, description: 'Şansını artırır' },
  { id: 'treasure_chest', name: 'Hazine Sandığı', emoji: '📦', price: 1000, description: 'İçinde sürpriz ödüller' },
  { id: 'crown', name: 'Taç', emoji: '👑', price: 2000, description: 'Sunucunun en prestijli eşyası' },
  { id: 'potion', name: 'XP İksiri', emoji: '🧪', price: 300, description: 'Bir sonraki mesajda 2x XP' },
];

export default {
  category: '💰 Ekonomi',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Mağazayı görüntüle veya alışveriş yap')
    .addSubcommand(s => s.setName('liste').setDescription('Mağaza ürünlerini listele'))
    .addSubcommand(s =>
      s.setName('satin-al')
        .setDescription('Ürün satın al')
        .addStringOption(o =>
          o.setName('urun').setDescription('Ürün ID').setRequired(true)
            .addChoices(...SHOP_ITEMS.map(i => ({ name: `${i.emoji} ${i.name} — ${i.price}🪙`, value: i.id })))
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;
    const uid = interaction.user.id;

    if (sub === 'liste') {
      const list = SHOP_ITEMS.map(i =>
        `${i.emoji} **${i.name}** — \`${i.id}\`\n> ${i.description}\n> 💰 **${i.price} 🪙**`
      ).join('\n\n');

      return interaction.reply({
        embeds: [createEmbed({
          type: 'info',
          title: '🏪 Mağaza',
          description: list,
          footer: '/shop satin-al urun:ID ile satın al',
        })],
      });
    }

    if (sub === 'satin-al') {
      const itemId = interaction.options.getString('urun');
      const item = SHOP_ITEMS.find(i => i.id === itemId);
      if (!item) return interaction.reply({ embeds: [errorEmbed('Ürün bulunamadı.')], ephemeral: true });

      const ecoKey = `${uid}_${gid}`;
      if (!economyData.has(ecoKey)) economyData.set(ecoKey, { balance: 0, bank: 0, lastDaily: 0, lastWork: 0 });
      const eco = economyData.get(ecoKey);

      if (eco.balance < item.price) {
        return interaction.reply({ embeds: [errorEmbed(`Yetersiz bakiye. Gereken: **${item.price} 🪙**, Mevcut: **${eco.balance} 🪙**`)], ephemeral: true });
      }

      eco.balance -= item.price;
      addItem(uid, gid, item.name, item.emoji);

      return interaction.reply({
        embeds: [successEmbed(
          `${item.emoji} **${item.name}** satın alındı!\n💰 Kalan bakiye: **${eco.balance} 🪙**`,
          '✅ Satın Alındı'
        )],
      });
    }
  },
};
