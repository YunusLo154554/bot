import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { successEmbed, errorEmbed, createEmbed, infoEmbed } from '../../utils/embed.js';

// guildId -> { channelId }
export const suggestionConfig = new Map();

export default {
  category: '⚙️ Yönetim',
  cooldown: 30,
  data: new SlashCommandBuilder()
    .setName('suggestion')
    .setDescription('Öneri sistemi')
    .addSubcommand(s =>
      s.setName('kur')
        .setDescription('Öneri kanalını ayarla')
        .addChannelOption(o => o.setName('kanal').setDescription('Öneri kanalı').setRequired(true))
    )
    .addSubcommand(s =>
      s.setName('gonder')
        .setDescription('Öneri gönder')
        .addStringOption(o => o.setName('oneri').setDescription('Önerin').setRequired(true).setMaxLength(500))
    )
    .addSubcommand(s =>
      s.setName('onayla')
        .setDescription('Öneriyi onayla')
        .addStringOption(o => o.setName('mesajid').setDescription('Öneri mesaj ID\'si').setRequired(true))
        .addStringOption(o => o.setName('not').setDescription('Yönetici notu').setRequired(false))
    )
    .addSubcommand(s =>
      s.setName('reddet')
        .setDescription('Öneriyi reddet')
        .addStringOption(o => o.setName('mesajid').setDescription('Öneri mesaj ID\'si').setRequired(true))
        .addStringOption(o => o.setName('sebep').setDescription('Red sebebi').setRequired(false))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === 'kur') {
      const ch = interaction.options.getChannel('kanal');
      suggestionConfig.set(gid, { channelId: ch.id });
      return interaction.reply({ embeds: [successEmbed(`Öneri kanalı ${ch} olarak ayarlandı.`, '💡 Öneri Sistemi')] });
    }

    if (sub === 'gonder') {
      const cfg = suggestionConfig.get(gid);
      if (!cfg) return interaction.reply({ embeds: [errorEmbed('Öneri sistemi kurulmamış.')], ephemeral: true });

      const text = interaction.options.getString('oneri');
      const ch = interaction.guild.channels.cache.get(cfg.channelId);
      if (!ch) return interaction.reply({ embeds: [errorEmbed('Öneri kanalı bulunamadı.')], ephemeral: true });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('sug_up').setLabel('👍 0').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('sug_down').setLabel('👎 0').setStyle(ButtonStyle.Danger),
      );

      await ch.send({
        embeds: [createEmbed({
          type: 'info',
          title: '💡 Yeni Öneri',
          description: text,
          fields: [{ name: '👤 Öneren', value: `${interaction.user}`, inline: true }],
          footer: 'Oylayarak görüşünü belirt!',
        })],
        components: [row],
      });

      return interaction.reply({ embeds: [successEmbed('Önerin gönderildi!', '💡 Öneri')], ephemeral: true });
    }

    if (sub === 'onayla' || sub === 'reddet') {
      const msgId = interaction.options.getString('mesajid');
      const note = interaction.options.getString('not') ?? interaction.options.getString('sebep') ?? 'Belirtilmedi';
      const cfg = suggestionConfig.get(gid);
      if (!cfg) return interaction.reply({ embeds: [errorEmbed('Öneri sistemi kurulmamış.')], ephemeral: true });

      const ch = interaction.guild.channels.cache.get(cfg.channelId);
      const msg = await ch?.messages.fetch(msgId).catch(() => null);
      if (!msg) return interaction.reply({ embeds: [errorEmbed('Mesaj bulunamadı.')], ephemeral: true });

      const approved = sub === 'onayla';
      await msg.edit({
        embeds: [createEmbed({
          type: approved ? 'success' : 'error',
          title: approved ? '✅ Öneri Onaylandı' : '❌ Öneri Reddedildi',
          description: msg.embeds[0]?.description ?? '',
          fields: [
            { name: '👮 Yetkili', value: `${interaction.user}`, inline: true },
            { name: approved ? '📝 Not' : '📝 Sebep', value: note, inline: true },
          ],
        })],
        components: [],
      });

      return interaction.reply({ embeds: [successEmbed(`Öneri ${approved ? 'onaylandı' : 'reddedildi'}.`)], ephemeral: true });
    }
  },
};
