import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed, infoEmbed } from '../../utils/embed.js';

// guildId -> Set<userId>
export const blacklistData = new Map();

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Kara liste sistemini yönet')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s =>
      s.setName('ekle')
        .setDescription('Kullanıcıyı kara listeye ekle')
        .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
        .addStringOption(o => o.setName('sebep').setDescription('Sebep').setRequired(false))
    )
    .addSubcommand(s =>
      s.setName('cikar')
        .setDescription('Kullanıcıyı kara listeden çıkar')
        .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
    )
    .addSubcommand(s => s.setName('liste').setDescription('Kara listeyi göster')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;
    if (!blacklistData.has(gid)) blacklistData.set(gid, new Map());
    const bl = blacklistData.get(gid);

    if (sub === 'ekle') {
      const user = interaction.options.getUser('kullanici');
      const reason = interaction.options.getString('sebep') ?? 'Sebep belirtilmedi';
      bl.set(user.id, { username: user.username, reason, addedAt: Date.now() });
      return interaction.reply({ embeds: [successEmbed(`**${user.username}** kara listeye eklendi.\n📝 Sebep: ${reason}`, '🚫 Blacklist')] });
    }
    if (sub === 'cikar') {
      const user = interaction.options.getUser('kullanici');
      if (!bl.has(user.id)) return interaction.reply({ embeds: [errorEmbed('Bu kullanıcı kara listede değil.')], ephemeral: true });
      bl.delete(user.id);
      return interaction.reply({ embeds: [successEmbed(`**${user.username}** kara listeden çıkarıldı.`)] });
    }
    if (sub === 'liste') {
      if (!bl.size) return interaction.reply({ embeds: [infoEmbed('Kara liste boş.', '🚫 Blacklist')] });
      const entries = [...bl.entries()].map(([id, d]) => `<@${id}> — ${d.reason}`).join('\n');
      return interaction.reply({ embeds: [infoEmbed(entries, `🚫 Kara Liste (${bl.size} kişi)`)] });
    }
  },
};
