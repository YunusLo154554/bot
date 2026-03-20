import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  permissions: [PermissionFlagsBits.BanMembers],
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bir kullanıcıyı sunucudan yasaklar')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(opt =>
      opt.setName('kullanici').setDescription('Yasaklanacak kullanıcı').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('sebep').setDescription('Yasaklama sebebi').setRequired(false)
    )
    .addIntegerOption(opt =>
      opt.setName('mesaj_sil').setDescription('Kaç günlük mesaj silinsin? (0-7)').setMinValue(0).setMaxValue(7)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('kullanici');
    const reason = interaction.options.getString('sebep') ?? 'Sebep belirtilmedi';
    const deleteMessageDays = interaction.options.getInteger('mesaj_sil') ?? 0;

    if (target.id === interaction.user.id) {
      return interaction.reply({ embeds: [errorEmbed('Kendini yasaklayamazsın.')], ephemeral: true });
    }

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    // Kullanıcı sunucuda değilse direkt ban at
    if (member) {
      if (!member.bannable) {
        return interaction.reply({ embeds: [errorEmbed('Bu kullanıcıyı yasaklayamam. Rolü benden yüksek olabilir.')], ephemeral: true });
      }
      await member.ban({ reason: `${interaction.user.username}: ${reason}`, deleteMessageSeconds: deleteMessageDays * 86400 });
    } else {
      await interaction.guild.bans.create(target.id, { reason: `${interaction.user.username}: ${reason}`, deleteMessageSeconds: deleteMessageDays * 86400 }).catch(e => {
        throw new Error(`Ban uygulanamadı: ${e.message}`);
      });
    }

    await interaction.reply({
      embeds: [successEmbed(`**${target.username}** yasaklandı.\n📝 Sebep: ${reason}`, '🔨 Kullanıcı Yasaklandı')],
    });
  },
};
