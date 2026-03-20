import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed, createEmbed } from '../../utils/embed.js';

export default {
  category: '⚙️ Yönetim',
  cooldown: 10,
  permissions: [PermissionFlagsBits.ManageWebhooks],
  data: new SlashCommandBuilder()
    .setName('webhook')
    .setDescription('Webhook yönetimi')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageWebhooks)
    .addSubcommand(s =>
      s.setName('olustur')
        .setDescription('Bu kanala webhook oluştur')
        .addStringOption(o => o.setName('isim').setDescription('Webhook adı').setRequired(true))
        .addStringOption(o => o.setName('avatar').setDescription('Avatar URL (opsiyonel)').setRequired(false))
    )
    .addSubcommand(s => s.setName('liste').setDescription('Bu kanaldaki webhookları listele'))
    .addSubcommand(s =>
      s.setName('sil')
        .setDescription('Webhook sil')
        .addStringOption(o => o.setName('id').setDescription('Webhook ID').setRequired(true))
    )
    .addSubcommand(s =>
      s.setName('gonder')
        .setDescription('Webhook ile mesaj gönder')
        .addStringOption(o => o.setName('id').setDescription('Webhook ID').setRequired(true))
        .addStringOption(o => o.setName('mesaj').setDescription('Gönderilecek mesaj').setRequired(true))
        .addStringOption(o => o.setName('isim').setDescription('Gönderen adı').setRequired(false))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'olustur') {
      const name = interaction.options.getString('isim');
      const avatar = interaction.options.getString('avatar');
      try {
        const wh = await interaction.channel.createWebhook({
          name,
          avatar: avatar ?? undefined,
          reason: `${interaction.user.username} tarafından oluşturuldu`,
        });
        return interaction.reply({
          embeds: [createEmbed({
            type: 'success',
            title: '🔗 Webhook Oluşturuldu',
            fields: [
              { name: '📛 İsim', value: wh.name, inline: true },
              { name: '🆔 ID', value: wh.id, inline: true },
            ],
            footer: 'URL güvenlik nedeniyle gösterilmiyor',
          })],
          ephemeral: true,
        });
      } catch (err) {
        return interaction.reply({ embeds: [errorEmbed(`Webhook oluşturulamadı: ${err.message}`)], ephemeral: true });
      }
    }

    if (sub === 'liste') {
      const webhooks = await interaction.channel.fetchWebhooks();
      if (!webhooks.size) return interaction.reply({ embeds: [errorEmbed('Bu kanalda webhook yok.')], ephemeral: true });
      const list = webhooks.map(w => `**${w.name}** — \`${w.id}\``).join('\n');
      return interaction.reply({ embeds: [createEmbed({ type: 'info', title: '🔗 Webhooklar', description: list })], ephemeral: true });
    }

    if (sub === 'sil') {
      const id = interaction.options.getString('id');
      try {
        const wh = await interaction.client.fetchWebhook(id);
        await wh.delete(`${interaction.user.username} tarafından silindi`);
        return interaction.reply({ embeds: [successEmbed(`Webhook \`${id}\` silindi.`)], ephemeral: true });
      } catch {
        return interaction.reply({ embeds: [errorEmbed('Webhook bulunamadı veya silinemedi.')], ephemeral: true });
      }
    }

    if (sub === 'gonder') {
      const id = interaction.options.getString('id');
      const msg = interaction.options.getString('mesaj');
      const name = interaction.options.getString('isim');
      try {
        const wh = await interaction.client.fetchWebhook(id);
        await wh.send({ content: msg, username: name ?? wh.name });
        return interaction.reply({ embeds: [successEmbed('Mesaj webhook ile gönderildi.')], ephemeral: true });
      } catch {
        return interaction.reply({ embeds: [errorEmbed('Webhook bulunamadı veya mesaj gönderilemedi.')], ephemeral: true });
      }
    }
  },
};
