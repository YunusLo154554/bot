import { SlashCommandBuilder, PermissionFlagsBits, WebhookClient } from 'discord.js';
import { errorEmbed } from '../../utils/embed.js';

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('konustur')
    .setDescription('Bir kullanıcı adına mesaj gönderir')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(o => o.setName('kullanici').setDescription('Konuşturulacak kullanıcı').setRequired(true))
    .addStringOption(o => o.setName('mesaj').setDescription('Gönderilecek mesaj').setRequired(true).setMaxLength(2000)),

  async execute(interaction) {
    const target = interaction.options.getMember('kullanici');
    const mesaj = interaction.options.getString('mesaj');

    if (!target) return interaction.reply({ embeds: [errorEmbed('Kullanıcı bulunamadı.')], ephemeral: true });

    // Webhook ile kullanıcının adı ve avatarıyla gönder
    let webhook;
    try {
      webhook = await interaction.channel.createWebhook({
        name: target.displayName,
        avatar: target.user.displayAvatarURL({ size: 128 }),
        reason: `konustur komutu — ${interaction.user.username}`,
      });

      await webhook.send({ content: mesaj });
      await webhook.delete();
    } catch (e) {
      await webhook?.delete().catch(() => null);
      return interaction.reply({ embeds: [errorEmbed(`Mesaj gönderilemedi: ${e.message}`)], ephemeral: true });
    }

    await interaction.reply({ content: '✅', ephemeral: true });
  },
};
