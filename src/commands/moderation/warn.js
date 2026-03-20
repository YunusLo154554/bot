import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { warnEmbed, errorEmbed } from '../../utils/embed.js';

// Global warnings Map
export const warningsMap = new Map();

export function addWarning(userId, username, reason) {
  if (!warningsMap.has(userId)) {
    warningsMap.set(userId, { userId, username, count: 0, reasons: [], timestamps: [] });
  }
  const user = warningsMap.get(userId);
  user.username = username;
  user.count++;
  user.reasons.push(reason);
  user.timestamps.push(new Date().toISOString());
  return user.count;
}

export function getWarnings(userId) {
  return warningsMap.get(userId) ?? { userId, username: 'Bilinmiyor', count: 0, reasons: [], timestamps: [] };
}

export function clearUserWarnings(userId) {
  warningsMap.delete(userId);
}

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ModerateMembers],
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Kullanıcıya uyarı ver')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt =>
      opt.setName('kullanici').setDescription('Uyarılacak kullanıcı').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('sebep').setDescription('Uyarı sebebi').setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('kullanici');
    const reason = interaction.options.getString('sebep');

    const count = addWarning(target.id, target.username, reason);

    const embed = warnEmbed(
      `**${target.username}** uyarıldı.\n📝 Sebep: ${reason}\n⚠️ Toplam uyarı: **${count}**`,
      '⚠️ Uyarı Verildi'
    );

    if (count >= 3) {
      embed.addFields({ name: '🚨 Dikkat', value: '3 uyarıya ulaşıldı — timeout veya ban düşünün.' });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
