import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed, warnEmbed, createEmbed } from '../../utils/embed.js';

export default {
  category: '🔨 Moderasyon',
  cooldown: 15,
  permissions: [PermissionFlagsBits.BanMembers],
  data: new SlashCommandBuilder()
    .setName('massban')
    .setDescription('Birden fazla kullanıcıyı yasaklar (ID\'leri boşlukla ayır)')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(o => o.setName('idler').setDescription('Kullanıcı ID\'leri (boşlukla ayır)').setRequired(true))
    .addStringOption(o => o.setName('sebep').setDescription('Sebep').setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply();

    const ids = interaction.options.getString('idler').split(/\s+/).filter(id => /^\d{17,20}$/.test(id));
    const reason = interaction.options.getString('sebep') ?? 'Massban';

    if (!ids.length) {
      return interaction.editReply({ embeds: [errorEmbed('Geçerli kullanıcı ID\'si bulunamadı.')] });
    }
    if (ids.length > 20) {
      return interaction.editReply({ embeds: [warnEmbed('En fazla 20 kullanıcı aynı anda yasaklanabilir.')] });
    }

    const results = { success: [], failed: [] };

    for (const id of ids) {
      try {
        await interaction.guild.bans.create(id, { deleteMessageSeconds: 86400, reason: `Massban: ${reason} — ${interaction.user.username}` });
        results.success.push(id);
      } catch {
        results.failed.push(id);
      }
    }

    await interaction.editReply({
      embeds: [createEmbed({
        type: results.failed.length === 0 ? 'success' : 'warning',
        title: '🔨 Massban Sonucu',
        fields: [
          { name: '✅ Yasaklanan', value: results.success.length ? results.success.join('\n') : 'Yok', inline: true },
          { name: '❌ Başarısız', value: results.failed.length ? results.failed.join('\n') : 'Yok', inline: true },
          { name: '📝 Sebep', value: reason, inline: false },
        ],
      })],
    });
  },
};
