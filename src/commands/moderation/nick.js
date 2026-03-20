import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageNicknames],
  data: new SlashCommandBuilder()
    .setName('nick')
    .setDescription('Kullanıcının sunucu adını değiştir')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
    .addUserOption(opt =>
      opt.setName('kullanici').setDescription('Kullanıcı').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('ad').setDescription('Yeni ad (boş bırakırsan sıfırlanır)').setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('kullanici');
    const newNick = interaction.options.getString('ad') ?? null;
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) return interaction.reply({ embeds: [errorEmbed('Kullanıcı bulunamadı.')], ephemeral: true });
    if (!member.manageable) return interaction.reply({ embeds: [errorEmbed('Bu kullanıcının adını değiştiremem.')], ephemeral: true });

    const oldNick = member.displayName;
    await member.setNickname(newNick, `${interaction.user.username} tarafından değiştirildi`);

    await interaction.reply({
      embeds: [successEmbed(
        `**${target.username}** adı değiştirildi.\n📝 Eski: \`${oldNick}\` → Yeni: \`${newNick ?? target.username}\``,
        '✏️ Nickname Değiştirildi'
      )],
    });
  },
};
