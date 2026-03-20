import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed, createEmbed, infoEmbed } from '../../utils/embed.js';

// guildId -> Map<trigger, { response, createdBy }>
export const customCmds = new Map();

export default {
  category: '⚙️ Yönetim',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName('customcommands')
    .setDescription('Özel komutları yönet')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s =>
      s.setName('ekle')
        .setDescription('Özel komut ekle')
        .addStringOption(o => o.setName('tetikleyici').setDescription('Komut tetikleyicisi (örn: !merhaba)').setRequired(true))
        .addStringOption(o => o.setName('yanit').setDescription('Bot yanıtı').setRequired(true))
    )
    .addSubcommand(s =>
      s.setName('sil')
        .setDescription('Özel komut sil')
        .addStringOption(o => o.setName('tetikleyici').setDescription('Silinecek tetikleyici').setRequired(true))
    )
    .addSubcommand(s => s.setName('liste').setDescription('Tüm özel komutları listele')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;
    if (!customCmds.has(gid)) customCmds.set(gid, new Map());
    const cmds = customCmds.get(gid);

    if (sub === 'ekle') {
      const trigger = interaction.options.getString('tetikleyici').toLowerCase().trim();
      const response = interaction.options.getString('yanit');
      if (cmds.size >= 50) return interaction.reply({ embeds: [errorEmbed('Maksimum 50 özel komut eklenebilir.')], ephemeral: true });
      cmds.set(trigger, { response, createdBy: interaction.user.id });
      return interaction.reply({ embeds: [successEmbed(`\`${trigger}\` → ${response}`, '✅ Özel Komut Eklendi')] });
    }

    if (sub === 'sil') {
      const trigger = interaction.options.getString('tetikleyici').toLowerCase().trim();
      if (!cmds.has(trigger)) return interaction.reply({ embeds: [errorEmbed(`\`${trigger}\` bulunamadı.`)], ephemeral: true });
      cmds.delete(trigger);
      return interaction.reply({ embeds: [successEmbed(`\`${trigger}\` silindi.`)] });
    }

    if (sub === 'liste') {
      if (!cmds.size) return interaction.reply({ embeds: [infoEmbed('Özel komut yok.', '📋 Özel Komutlar')] });
      const list = [...cmds.entries()].map(([t, d]) => `\`${t}\` → ${d.response.slice(0, 50)}`).join('\n');
      return interaction.reply({ embeds: [createEmbed({ type: 'info', title: `📋 Özel Komutlar (${cmds.size})`, description: list })] });
    }
  },
};
