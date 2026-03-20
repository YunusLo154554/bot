import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed, createEmbed } from '../../utils/embed.js';

// guildId -> roleId (karantina rolü)
export const karantinaConfig = new Map();
// userId -> [savedRoleIds]
export const karantinaUsers = new Map();

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ModerateMembers],
  data: new SlashCommandBuilder()
    .setName('karantina')
    .setDescription('Kullanıcıyı karantinaya al veya çıkar')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(s =>
      s.setName('kur')
        .setDescription('Karantina rolü oluştur')
    )
    .addSubcommand(s =>
      s.setName('al')
        .setDescription('Kullanıcıyı karantinaya al')
        .addUserOption(o => o.setName('kullanici').setDescription('Hedef').setRequired(true))
        .addStringOption(o => o.setName('sebep').setDescription('Sebep').setRequired(false))
    )
    .addSubcommand(s =>
      s.setName('cikar')
        .setDescription('Kullanıcıyı karantinadan çıkar')
        .addUserOption(o => o.setName('kullanici').setDescription('Hedef').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;
    const gid = guild.id;

    if (sub === 'kur') {
      await interaction.deferReply({ ephemeral: true });

      let role = guild.roles.cache.find(r => r.name === '🔇 Karantina');
      if (!role) {
        role = await guild.roles.create({
          name: '🔇 Karantina',
          color: 0x808080,
          reason: 'Karantina sistemi kurulumu',
        });
      }

      // Tüm kanallardan engelle
      for (const [, ch] of guild.channels.cache) {
        if (ch.isTextBased() || ch.isVoiceBased()) {
          await ch.permissionOverwrites.edit(role, {
            SendMessages: false,
            AddReactions: false,
            Connect: false,
            Speak: false,
          }).catch(() => null);
        }
      }

      karantinaConfig.set(gid, role.id);
      return interaction.editReply({ embeds: [successEmbed(`Karantina rolü oluşturuldu: **${role.name}**`, '🔇 Karantina Kuruldu')] });
    }

    if (sub === 'al') {
      const roleId = karantinaConfig.get(gid);
      if (!roleId) return interaction.reply({ embeds: [errorEmbed('Karantina sistemi kurulmamış. `/karantina kur` kullan.')], ephemeral: true });

      const target = interaction.options.getUser('kullanici');
      const reason = interaction.options.getString('sebep') ?? 'Sebep belirtilmedi';
      const member = await guild.members.fetch(target.id).catch(() => null);

      if (!member) return interaction.reply({ embeds: [errorEmbed('Kullanıcı bulunamadı.')], ephemeral: true });
      if (!member.manageable) return interaction.reply({ embeds: [errorEmbed('Bu kullanıcıyı yönetemem.')], ephemeral: true });
      if (karantinaUsers.has(target.id)) return interaction.reply({ embeds: [errorEmbed('Kullanıcı zaten karantinada.')], ephemeral: true });

      const saved = member.roles.cache.filter(r => !r.managed && r.id !== guild.id).map(r => r.id);
      karantinaUsers.set(target.id, saved);
      await member.roles.set([roleId], `Karantina: ${reason}`);

      return interaction.reply({
        embeds: [successEmbed(`**${target.username}** karantinaya alındı.\n📝 Sebep: ${reason}`, '🔇 Karantina')],
      });
    }

    if (sub === 'cikar') {
      const target = interaction.options.getUser('kullanici');
      const member = await guild.members.fetch(target.id).catch(() => null);

      if (!member) return interaction.reply({ embeds: [errorEmbed('Kullanıcı bulunamadı.')], ephemeral: true });
      if (!karantinaUsers.has(target.id)) return interaction.reply({ embeds: [errorEmbed('Bu kullanıcı karantinada değil.')], ephemeral: true });

      const saved = karantinaUsers.get(target.id).filter(id => guild.roles.cache.has(id));
      karantinaUsers.delete(target.id);
      await member.roles.set(saved, 'Karantina kaldırıldı');

      return interaction.reply({ embeds: [successEmbed(`**${target.username}** karantinadan çıkarıldı.`, '✅ Karantina Kaldırıldı')] });
    }
  },
};
