import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed, createEmbed } from '../../utils/embed.js';

const giveaways = new Map();

export default {
  category: '🎮 Eğlence',
  cooldown: 10,
  permissions: [PermissionFlagsBits.ManageMessages],
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Çekiliş başlat')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(opt =>
      opt.setName('ödül').setDescription('Ödül adı').setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('saniye').setDescription('Çekiliş süresi (saniye)').setRequired(true).setMinValue(10).setMaxValue(86400)
    )
    .addIntegerOption(opt =>
      opt.setName('kazanan').setDescription('Kaç kişi kazanacak?').setRequired(true).setMinValue(1).setMaxValue(10)
    ),

  async execute(interaction) {
    const prize = interaction.options.getString('ödül');
    const duration = interaction.options.getInteger('saniye') * 1000;
    const winners = interaction.options.getInteger('kazanan');

    const embed = createEmbed({
      type: 'success',
      title: '🎉 ÇEKİLİŞ BAŞLADI',
      fields: [
        { name: '🏆 Ödül', value: prize, inline: true },
        { name: '⏱️ Süre', value: `${interaction.options.getInteger('saniye')}s`, inline: true },
        { name: '👥 Kazanan', value: `${winners}`, inline: true },
        { name: '📌 Katılmak için', value: 'Aşağıdaki emoji\'ye tıkla ⬇️', inline: false },
      ],
      footer: `Başlatan: ${interaction.user.username}`,
    });

    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
    await msg.react('🎉');

    const participants = new Set();
    const giveaway = {
      messageId: msg.id,
      channelId: interaction.channelId,
      prize,
      winners,
      participants,
      endTime: Date.now() + duration,
    };

    giveaways.set(msg.id, giveaway);

    // Reaction collector
    const collector = msg.createReactionCollector({
      filter: (reaction, user) => reaction.emoji.name === '🎉' && !user.bot,
      time: duration,
    });

    collector.on('collect', (reaction, user) => {
      participants.add(user.id);
    });

    collector.on('remove', (reaction, user) => {
      participants.delete(user.id);
    });

    collector.on('end', async () => {
      const participantList = Array.from(participants);

      if (!participantList.length) {
        await interaction.followUp({
          embeds: [errorEmbed('Çekiliş katılımcısı olmadığı için iptal edildi.')],
        });
        giveaways.delete(msg.id);
        return;
      }

      const selected = [];
      const tempList = [...participantList];
      for (let i = 0; i < Math.min(winners, tempList.length); i++) {
        const idx = Math.floor(Math.random() * tempList.length);
        selected.push(tempList.splice(idx, 1)[0]);
      }

      const resultEmbed = createEmbed({
        type: 'success',
        title: '🎊 ÇEKİLİŞ BİTTİ',
        fields: [
          { name: '🏆 Ödül', value: prize, inline: false },
          { name: '🎯 Kazananlar', value: selected.map(id => `<@${id}>`).join('\n'), inline: false },
          { name: '👥 Toplam Katılımcı', value: `${participantList.length}`, inline: false },
        ],
      });

      await interaction.followUp({ embeds: [resultEmbed] });
      giveaways.delete(msg.id);
    });
  },
};

// Giveaway listener setup
export function setupGiveawayListener(client) {
  // Reaction collector otomatik çalışıyor, bu fonksiyon opsiyonel
}
