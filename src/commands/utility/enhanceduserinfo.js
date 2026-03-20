import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embed.js';

const FLAGS_MAP = {
  Staff: '👨‍💼 Discord Çalışanı',
  Partner: '🤝 Partner',
  Hypesquad: '🏠 HypeSquad Events',
  BugHunterLevel1: '🐛 Bug Hunter',
  BugHunterLevel2: '🐛 Bug Hunter Gold',
  HypeSquadOnlineHouse1: '🏠 Bravery',
  HypeSquadOnlineHouse2: '🏠 Brilliance',
  HypeSquadOnlineHouse3: '🏠 Balance',
  PremiumEarlySupporter: '⭐ Early Supporter',
  VerifiedDeveloper: '👨‍💻 Verified Developer',
  ActiveDeveloper: '🔨 Active Developer',
  CertifiedModerator: '🛡️ Certified Moderator',
};

export default {
  category: '🔧 Araçlar',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('enhanceduserinfo')
    .setDescription('Gelişmiş kullanıcı bilgileri')
    .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı (boş = sen)').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('kullanici') ?? interaction.user;
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    // Flags
    const flags = target.flags?.toArray() ?? [];
    const badgeStr = flags.map(f => FLAGS_MAP[f] ?? f).join('\n') || 'Yok';

    // Permissions
    const keyPerms = member?.permissions.toArray()
      .filter(p => ['Administrator', 'ManageGuild', 'ManageChannels', 'ManageRoles', 'BanMembers', 'KickMembers', 'ModerateMembers'].includes(p))
      .map(p => `\`${p}\``)
      .join(', ') || 'Yok';

    // Roles (top 10)
    const roles = member?.roles.cache
      .filter(r => r.id !== interaction.guild.id)
      .sort((a, b) => b.position - a.position)
      .first(10)
      .map(r => `${r}`)
      .join(' ') || 'Yok';

    await interaction.reply({
      embeds: [createEmbed({
        type: 'info',
        title: `🔍 ${target.username} — Gelişmiş Bilgi`,
        thumbnail: target.displayAvatarURL({ size: 256 }),
        fields: [
          { name: '🆔 ID', value: target.id, inline: true },
          { name: '🤖 Bot', value: target.bot ? 'Evet' : 'Hayır', inline: true },
          { name: '🎂 Hesap', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '📅 Katılım', value: member?.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Bilinmiyor', inline: true },
          { name: '🎨 Renk', value: member?.displayHexColor ?? '#000000', inline: true },
          { name: '📢 Nickname', value: member?.nickname ?? 'Yok', inline: true },
          { name: '🏅 Rozetler', value: badgeStr, inline: false },
          { name: '🔑 Önemli İzinler', value: keyPerms, inline: false },
          { name: '🎭 Roller', value: roles, inline: false },
        ],
      })],
    });
  },
};
