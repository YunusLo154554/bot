import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { successEmbed, errorEmbed, createEmbed, infoEmbed } from '../../utils/embed.js';

// guildId -> { roleId, channelId, enabled }
export const captchaConfig = new Map();
// userId -> { code, attempts, guildId }
export const captchaPending = new Map();

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default {
  category: '⚙️ Yönetim',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('captcha')
    .setDescription('CAPTCHA doğrulama sistemi')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s =>
      s.setName('kur')
        .setDescription('CAPTCHA sistemini kur')
        .addRoleOption(o => o.setName('rol').setDescription('Doğrulama sonrası verilecek rol').setRequired(true))
    )
    .addSubcommand(s => s.setName('kapat').setDescription('CAPTCHA sistemini devre dışı bırak'))
    .addSubcommand(s => s.setName('dogrula').setDescription('CAPTCHA kodunu gir').addStringOption(o => o.setName('kod').setDescription('CAPTCHA kodu').setRequired(true)))
    .addSubcommand(s => s.setName('gonder').setDescription('Sana CAPTCHA gönder')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === 'kur') {
      const role = interaction.options.getRole('rol');
      captchaConfig.set(gid, { roleId: role.id, enabled: true });
      return interaction.reply({ embeds: [successEmbed(`CAPTCHA sistemi kuruldu!\n🎭 Rol: **${role.name}**`, '🔐 CAPTCHA')] });
    }

    if (sub === 'kapat') {
      const cfg = captchaConfig.get(gid);
      if (cfg) cfg.enabled = false;
      return interaction.reply({ embeds: [successEmbed('CAPTCHA sistemi devre dışı bırakıldı.')] });
    }

    if (sub === 'gonder') {
      const cfg = captchaConfig.get(gid);
      if (!cfg?.enabled) return interaction.reply({ embeds: [errorEmbed('CAPTCHA sistemi kurulmamış.')], ephemeral: true });

      const code = generateCode();
      captchaPending.set(interaction.user.id, { code, attempts: 3, guildId: gid });

      // Kodu görsel olarak bozuk göster
      const visual = code.split('').join(' ');

      await interaction.reply({
        embeds: [createEmbed({
          type: 'info',
          title: '🔐 CAPTCHA Doğrulaması',
          description: `Aşağıdaki kodu \`/captcha dogrula kod:KOD\` ile gir:\n\n## \`${visual}\`\n\n3 hakkın var.`,
          footer: 'Büyük/küçük harf fark etmez',
        })],
        ephemeral: true,
      });
    }

    if (sub === 'dogrula') {
      const pending = captchaPending.get(interaction.user.id);
      if (!pending) return interaction.reply({ embeds: [errorEmbed('Aktif CAPTCHA yok. Önce `/captcha gonder` kullan.')], ephemeral: true });

      const input = interaction.options.getString('kod').toUpperCase().trim();

      if (input !== pending.code) {
        pending.attempts--;
        if (pending.attempts <= 0) {
          captchaPending.delete(interaction.user.id);
          return interaction.reply({ embeds: [errorEmbed('Tüm haklarını kullandın. Tekrar dene.')], ephemeral: true });
        }
        return interaction.reply({ embeds: [errorEmbed(`Yanlış kod. **${pending.attempts}** hakkın kaldı.`)], ephemeral: true });
      }

      captchaPending.delete(interaction.user.id);
      const cfg = captchaConfig.get(pending.guildId);
      const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
      if (member && cfg?.roleId) {
        await member.roles.add(cfg.roleId, 'CAPTCHA doğrulaması').catch(() => null);
      }

      return interaction.reply({ embeds: [successEmbed('CAPTCHA doğrulandı! Rol verildi.', '✅ Doğrulandı')], ephemeral: true });
    }
  },
};
