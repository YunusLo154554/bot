import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed, warnEmbed } from '../../utils/embed.js';

export default {
  category: '🔨 Moderasyon',
  cooldown: 10,
  permissions: [PermissionFlagsBits.ManageChannels],
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Tüm metin kanallarını kilitle veya kilidi aç')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption(o =>
      o.setName('mod').setDescription('Mod').setRequired(true)
        .addChoices({ name: 'Kilitle', value: 'lock' }, { name: 'Kilidi Aç', value: 'unlock' })
    )
    .addStringOption(o => o.setName('sebep').setDescription('Sebep').setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply();

    const mod = interaction.options.getString('mod');
    const reason = interaction.options.getString('sebep') ?? 'Sebep belirtilmedi';
    const guild = interaction.guild;
    const everyoneRole = guild.roles.everyone;

    const textChannels = guild.channels.cache.filter(c => c.isTextBased() && c.permissionsFor(everyoneRole));
    let count = 0;

    for (const [, ch] of textChannels) {
      try {
        await ch.permissionOverwrites.edit(everyoneRole, {
          SendMessages: mod === 'lock' ? false : null,
        }, { reason: `Lockdown (${mod}): ${reason}` });
        count++;
      } catch { /* skip */ }
    }

    const isLock = mod === 'lock';
    await interaction.editReply({
      embeds: [successEmbed(
        `${count} kanal ${isLock ? 'kilitlendi 🔒' : 'açıldı 🔓'}\n📝 Sebep: ${reason}`,
        isLock ? '🔒 Lockdown Aktif' : '🔓 Lockdown Kaldırıldı'
      )],
    });
  },
};
