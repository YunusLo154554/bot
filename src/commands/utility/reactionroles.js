import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { successEmbed, errorEmbed, createEmbed } from '../../utils/embed.js';

// guildId -> Map<messageId, Map<emoji, roleId>>
export const reactionRolesData = new Map();

export default {
  category: '⚙️ Yönetim',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageRoles],
  data: new SlashCommandBuilder()
    .setName('reactionroles')
    .setDescription('Reaksiyon rolleri sistemi')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(s =>
      s.setName('panel')
        .setDescription('Rol seçim paneli gönder')
        .addStringOption(o => o.setName('baslik').setDescription('Panel başlığı').setRequired(true))
        .addStringOption(o => o.setName('roller').setDescription('Rol ID\'leri virgülle ayır (max 5)').setRequired(true))
    )
    .addSubcommand(s => s.setName('liste').setDescription('Aktif panelleri listele')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === 'panel') {
      const title = interaction.options.getString('baslik');
      const roleIds = interaction.options.getString('roller').split(',').map(r => r.trim()).slice(0, 5);

      const roles = roleIds.map(id => interaction.guild.roles.cache.get(id)).filter(Boolean);
      if (!roles.length) return interaction.reply({ embeds: [errorEmbed('Geçerli rol bulunamadı.')], ephemeral: true });

      const menu = new StringSelectMenuBuilder()
        .setCustomId('rr_select')
        .setPlaceholder('Rol seç...')
        .setMinValues(0)
        .setMaxValues(roles.length)
        .addOptions(roles.map(r => ({ label: r.name, value: r.id, description: `${r.members.size} üye` })));

      const row = new ActionRowBuilder().addComponents(menu);

      const msg = await interaction.channel.send({
        embeds: [createEmbed({
          type: 'info',
          title: `🎭 ${title}`,
          description: roles.map(r => `${r} — ${r.members.size} üye`).join('\n'),
          footer: 'Aşağıdan rol seç veya kaldır',
        })],
        components: [row],
      });

      if (!reactionRolesData.has(gid)) reactionRolesData.set(gid, new Map());
      reactionRolesData.get(gid).set(msg.id, roles.map(r => r.id));

      return interaction.reply({ embeds: [successEmbed('Rol seçim paneli gönderildi.')], ephemeral: true });
    }

    if (sub === 'liste') {
      const data = reactionRolesData.get(gid);
      if (!data?.size) return interaction.reply({ embeds: [errorEmbed('Aktif panel yok.')], ephemeral: true });
      const list = [...data.entries()].map(([msgId, roleIds]) =>
        `Mesaj: \`${msgId}\` — ${roleIds.map(id => `<@&${id}>`).join(', ')}`
      ).join('\n');
      return interaction.reply({ embeds: [createEmbed({ type: 'info', title: '🎭 Aktif Paneller', description: list })] });
    }
  },
};
