import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';
import { jailConfig, jailedUsers } from './jail.js';

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ModerateMembers],
  data: new SlashCommandBuilder()
    .setName('unjail')
    .setDescription('Kullanıcıyı hapisten çıkar')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('kullanici').setDescription('Çıkarılacak kullanıcı').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('kullanici');
    const guild = interaction.guild;
    const config = jailConfig.get(guild.id);

    if (!config) return interaction.reply({ embeds: [errorEmbed('Jail sistemi kurulmamış.')], ephemeral: true });
    if (!jailedUsers.has(target.id)) return interaction.reply({ embeds: [errorEmbed('Bu kullanıcı hapiste değil.')], ephemeral: true });

    const member = await guild.members.fetch(target.id).catch(() => null);
    if (!member) return interaction.reply({ embeds: [errorEmbed('Kullanıcı bulunamadı.')], ephemeral: true });

    const savedRoles = jailedUsers.get(target.id).filter(id => guild.roles.cache.has(id));
    jailedUsers.delete(target.id);
    await member.roles.set(savedRoles, 'Unjail');

    await interaction.reply({ embeds: [successEmbed(`**${target.username}** hapisten çıkarıldı.`, '🔓 Unjail')] });
  },
};
