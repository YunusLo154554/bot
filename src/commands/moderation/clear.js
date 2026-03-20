import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageMessages],
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Kanaldan mesaj siler')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(opt =>
      opt.setName('adet').setDescription('Silinecek mesaj sayısı (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)
    )
    .addUserOption(opt =>
      opt.setName('kullanici').setDescription('Sadece bu kullanıcının mesajlarını sil').setRequired(false)
    ),

  async execute(interaction) {
    const amount = interaction.options.getInteger('adet');
    const targetUser = interaction.options.getUser('kullanici');

    await interaction.deferReply({ ephemeral: true });

    const messages = await interaction.channel.messages.fetch({ limit: 100 });

    // Filter by user if specified, then slice to requested amount
    const toDelete = (targetUser
      ? messages.filter(m => m.author.id === targetUser.id)
      : messages
    ).first(amount);

    // Discord bulk delete only works for messages < 14 days old
    const recent = toDelete.filter(m => Date.now() - m.createdTimestamp < 12096e5);

    if (!recent.length) {
      return interaction.editReply({ embeds: [errorEmbed('Silinecek uygun mesaj bulunamadı (14 günden eski mesajlar silinemez).')] });
    }

    await interaction.channel.bulkDelete(recent, true);

    await interaction.editReply({
      embeds: [successEmbed(
        `**${recent.length}** mesaj silindi.${targetUser ? ` (${targetUser.username} filtresi)` : ''}`,
        '🗑️ Mesajlar Silindi'
      )],
    });
  },
};
