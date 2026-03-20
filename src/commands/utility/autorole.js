import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed, infoEmbed } from '../../utils/embed.js';

// guildId -> roleId
export const autoroleMap = new Map();

export default {
  category: '⚙️ Yönetim',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageRoles],
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Yeni üyelere otomatik rol ata')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(sub =>
      sub.setName('ayarla').setDescription('Autorole rolünü ayarla')
        .addRoleOption(opt =>
          opt.setName('rol').setDescription('Atanacak rol').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('kaldır').setDescription('Autorole\'u kaldır')
    )
    .addSubcommand(sub =>
      sub.setName('göster').setDescription('Mevcut autorole ayarını göster')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'ayarla') {
      const role = interaction.options.getRole('rol');

      if (role.managed) {
        return interaction.reply({ embeds: [errorEmbed('Bot rolleri autorole olarak ayarlanamaz.')], ephemeral: true });
      }
      if (role.id === guildId) {
        return interaction.reply({ embeds: [errorEmbed('@everyone rolü ayarlanamaz.')], ephemeral: true });
      }

      autoroleMap.set(guildId, role.id);
      await interaction.reply({
        embeds: [successEmbed(`Autorole ayarlandı: **${role.name}**\nYeni üyeler bu rolü otomatik alacak.`, '✅ Autorole')],
      });
    }

    if (sub === 'kaldır') {
      if (!autoroleMap.has(guildId)) {
        return interaction.reply({ embeds: [errorEmbed('Autorole zaten ayarlı değil.')], ephemeral: true });
      }
      autoroleMap.delete(guildId);
      await interaction.reply({ embeds: [successEmbed('Autorole kaldırıldı.', '✅ Kaldırıldı')] });
    }

    if (sub === 'göster') {
      const roleId = autoroleMap.get(guildId);
      if (!roleId) {
        return interaction.reply({ embeds: [infoEmbed('Autorole ayarlı değil.', 'ℹ️ Autorole')], ephemeral: true });
      }
      const role = interaction.guild.roles.cache.get(roleId);
      await interaction.reply({
        embeds: [infoEmbed(`Mevcut autorole: **${role?.name ?? 'Silinmiş rol'}**`, 'ℹ️ Autorole')],
        ephemeral: true,
      });
    }
  },
};
