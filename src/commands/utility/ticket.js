import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { createEmbed, successEmbed, errorEmbed, infoEmbed } from '../../utils/embed.js';

// guildId -> { categoryId, staffRoleId, logChannelId }
export const ticketConfig = new Map();
// channelId -> { userId, topic, openedAt }
export const openTickets = new Map();

export default {
  category: '⚙️ Yönetim',
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Destek ticket sistemi')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('kur')
        .setDescription('Ticket sistemini yapılandır')
        .addRoleOption(opt =>
          opt.setName('staff').setDescription('Ticket\'ları görecek yetkili rolü').setRequired(true)
        )
        .addChannelOption(opt =>
          opt.setName('log').setDescription('Kapatılan ticket logları için kanal').setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('panel')
        .setDescription('Ticket açma panelini gönder')
    )
    .addSubcommand(sub =>
      sub.setName('aç')
        .setDescription('Yeni destek ticket\'ı aç')
        .addStringOption(opt =>
          opt.setName('konu').setDescription('Destek konusu').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('kapat')
        .setDescription('Bu ticket\'ı kapat')
    )
    .addSubcommand(sub =>
      sub.setName('ekle')
        .setDescription('Ticket\'a kullanıcı ekle')
        .addUserOption(opt =>
          opt.setName('kullanici').setDescription('Eklenecek kullanıcı').setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;

    // --- KUR ---
    if (sub === 'kur') {
      const staffRole = interaction.options.getRole('staff');
      const logChannel = interaction.options.getChannel('log');

      // Ticket kategorisi oluştur
      let category = guild.channels.cache.find(c => c.name === '🎫 Ticketlar' && c.type === ChannelType.GuildCategory);
      if (!category) {
        category = await guild.channels.create({
          name: '🎫 Ticketlar',
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: staffRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          ],
        });
      }

      ticketConfig.set(guild.id, {
        categoryId: category.id,
        staffRoleId: staffRole.id,
        logChannelId: logChannel?.id ?? null,
      });

      await interaction.reply({
        embeds: [successEmbed(
          `Ticket sistemi kuruldu!\n📁 Kategori: **${category.name}**\n👮 Staff: **${staffRole.name}**${logChannel ? `\n📋 Log: ${logChannel}` : ''}`,
          '✅ Ticket Sistemi Hazır'
        )],
        ephemeral: true,
      });
    }

    // --- PANEL ---
    if (sub === 'panel') {
      const config = ticketConfig.get(guild.id);
      if (!config) {
        return interaction.reply({ embeds: [errorEmbed('Önce `/ticket kur` ile sistemi yapılandır.')], ephemeral: true });
      }

      const btn = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_create')
          .setLabel('🎫 Ticket Aç')
          .setStyle(ButtonStyle.Primary),
      );

      await interaction.channel.send({
        embeds: [createEmbed({
          type: 'info',
          title: '🎫 Destek Sistemi',
          description: 'Yardım almak için aşağıdaki butona tıkla.\nEkibimiz en kısa sürede sana yardımcı olacak.',
          footer: 'Her kullanıcı aynı anda 1 ticket açabilir.',
        })],
        components: [btn],
      });

      await interaction.reply({ content: '✅ Panel gönderildi.', ephemeral: true });
    }

    // --- AÇ ---
    if (sub === 'aç') {
      await openTicket(interaction, interaction.options.getString('konu'));
    }

    // --- KAPAT ---
    if (sub === 'kapat') {
      await closeTicket(interaction);
    }

    // --- EKLE ---
    if (sub === 'ekle') {
      if (!openTickets.has(interaction.channelId)) {
        return interaction.reply({ embeds: [errorEmbed('Bu kanal bir ticket değil.')], ephemeral: true });
      }
      const target = interaction.options.getUser('kullanici');
      await interaction.channel.permissionOverwrites.edit(target.id, {
        ViewChannel: true,
        SendMessages: true,
      });
      await interaction.reply({
        embeds: [successEmbed(`**${target.username}** ticket\'a eklendi.`)],
      });
    }
  },
};

// --- Yardımcı fonksiyonlar ---

export async function openTicket(interaction, topic) {
  const guild = interaction.guild;
  const config = ticketConfig.get(guild.id);

  if (!config) {
    return interaction.reply({ embeds: [errorEmbed('Ticket sistemi kurulmamış. Yöneticiye bildir.')], ephemeral: true });
  }

  // Zaten açık ticket var mı?
  const existing = [...openTickets.values()].find(t => t.userId === interaction.user.id);
  if (existing) {
    const ch = guild.channels.cache.get(existing.channelId);
    return interaction.reply({
      embeds: [errorEmbed(`Zaten açık bir ticket\'ın var: ${ch ?? 'kanal bulunamadı'}`)],
      ephemeral: true,
    });
  }

  const category = guild.channels.cache.get(config.categoryId);
  const channelName = `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}`;

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: category?.id,
    topic: `${interaction.user.username} — ${topic}`,
    permissionOverwrites: [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      { id: config.staffRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ],
  });

  openTickets.set(channel.id, { userId: interaction.user.id, channelId: channel.id, topic, openedAt: Date.now() });

  const closeBtn = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_close').setLabel('🔒 Kapat').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket_claim').setLabel('✋ Üstlen').setStyle(ButtonStyle.Secondary),
  );

  await channel.send({
    content: `${interaction.user} <@&${config.staffRoleId}>`,
    embeds: [createEmbed({
      type: 'info',
      title: '🎫 Destek Ticket\'ı',
      fields: [
        { name: '👤 Kullanıcı', value: `${interaction.user}`, inline: true },
        { name: '📝 Konu', value: topic, inline: true },
        { name: '🕐 Açılış', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
      ],
      footer: 'Kapatmak için 🔒 Kapat butonuna bas',
    })],
    components: [closeBtn],
  });

  await interaction.reply({
    embeds: [successEmbed(`Ticket açıldı: ${channel}`, '🎫 Ticket Oluşturuldu')],
    ephemeral: true,
  });
}

export async function closeTicket(interaction) {
  const ticket = openTickets.get(interaction.channelId);
  if (!ticket) {
    return interaction.reply({ embeds: [errorEmbed('Bu kanal bir ticket değil.')], ephemeral: true });
  }

  const config = ticketConfig.get(interaction.guild.id);
  const elapsed = Math.floor((Date.now() - ticket.openedAt) / 1000 / 60);

  // Log kanalına bildir
  if (config?.logChannelId) {
    const logCh = interaction.guild.channels.cache.get(config.logChannelId);
    await logCh?.send({
      embeds: [createEmbed({
        type: 'warning',
        title: '📋 Ticket Kapatıldı',
        fields: [
          { name: '🎫 Kanal', value: interaction.channel.name, inline: true },
          { name: '👤 Açan', value: `<@${ticket.userId}>`, inline: true },
          { name: '👮 Kapatan', value: `${interaction.user}`, inline: true },
          { name: '📝 Konu', value: ticket.topic, inline: true },
          { name: '⏱️ Süre', value: `${elapsed} dakika`, inline: true },
        ],
      })],
    }).catch(() => null);
  }

  openTickets.delete(interaction.channelId);

  await interaction.reply({ embeds: [successEmbed('Ticket 5 saniye içinde kapatılıyor...', '🔒 Kapatılıyor')] });
  setTimeout(() => interaction.channel.delete().catch(() => null), 5000);
}
