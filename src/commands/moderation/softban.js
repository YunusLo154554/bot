import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  permissions: [PermissionFlagsBits.BanMembers],
  data: new SlashCommandBuilder()
    .setName('softban')
    .setDescription('Kullanıcıyı yasaklar ve hemen affeder (son 7 günün mesajlarını siler)')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName('kullanici').setDescription('Hedef kullanıcı').setRequired(true))
    .addStringOption(o => o.setName('sebep').setDescription('Sebep').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('kullanici');
    const reason = interaction.options.getString('sebep') ?? 'Sebep belirtilmedi';
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (member && !member.bannable) {
      return interaction.reply({ embeds: [errorEmbed('Bu kullanıcıyı yasaklayamam.')], ephemeral: true });
    }

    await interaction.guild.bans.create(target.id, { deleteMessageSeconds: 604800, reason: `Softban: ${reason}` });
    await interaction.guild.bans.remove(target.id, 'Softban — otomatik unban');

    await interaction.reply({
      embeds: [successEmbed(`**${target.username}** softban edildi.\n📝 Sebep: ${reason}\n🗑️ Son 7 günün mesajları silindi.`, '🔨 Softban')],
    });
  },
};
