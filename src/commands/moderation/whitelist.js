import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed, infoEmbed } from '../../utils/embed.js';

// guildId -> Set<userId>
export const whitelistData = new Map();

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('Beyaz liste sistemini yönet')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s =>
      s.setName('ekle')
        .setDescription('Kullanıcıyı beyaz listeye ekle')
        .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
    )
    .addSubcommand(s =>
      s.setName('cikar')
        .setDescription('Kullanıcıyı beyaz listeden çıkar')
        .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
    )
    .addSubcommand(s => s.setName('liste').setDescription('Beyaz listeyi göster')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;
    if (!whitelistData.has(gid)) whitelistData.set(gid, new Set());
    const wl = whitelistData.get(gid);

    if (sub === 'ekle') {
      const user = interaction.options.getUser('kullanici');
      wl.add(user.id);
      return interaction.reply({ embeds: [successEmbed(`**${user.username}** beyaz listeye eklendi.`, '✅ Whitelist')] });
    }
    if (sub === 'cikar') {
      const user = interaction.options.getUser('kullanici');
      if (!wl.has(user.id)) return interaction.reply({ embeds: [errorEmbed('Bu kullanıcı beyaz listede değil.')], ephemeral: true });
      wl.delete(user.id);
      return interaction.reply({ embeds: [successEmbed(`**${user.username}** beyaz listeden çıkarıldı.`)] });
    }
    if (sub === 'liste') {
      if (!wl.size) return interaction.reply({ embeds: [infoEmbed('Beyaz liste boş.', '✅ Whitelist')] });
      const entries = [...wl].map(id => `<@${id}>`).join('\n');
      return interaction.reply({ embeds: [infoEmbed(entries, `✅ Beyaz Liste (${wl.size} kişi)`)] });
    }
  },
};
