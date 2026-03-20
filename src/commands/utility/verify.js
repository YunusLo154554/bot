import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} from 'discord.js';
import { createEmbed, successEmbed, errorEmbed } from '../../utils/embed.js';

// guildId -> { roleId, channelId }
export const verifyConfig = new Map();

export default {
  category: '⚙️ Yönetim',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageRoles],
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Doğrulama sistemi')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(sub =>
      sub.setName('kur')
        .setDescription('Doğrulama sistemini kur')
        .addRoleOption(opt =>
          opt.setName('rol').setDescription('Doğrulama sonrası verilecek rol').setRequired(true)
        )
        .addChannelOption(opt =>
          opt.setName('kanal').setDescription('Doğrulama mesajının gönderileceği kanal').setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('gönder')
        .setDescription('Doğrulama mesajını gönder')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;

    if (sub === 'kur') {
      const role = interaction.options.getRole('rol');
      const channel = interaction.options.getChannel('kanal') ?? interaction.channel;

      if (role.managed || role.id === guild.id) {
        return interaction.reply({ embeds: [errorEmbed('Bu rol kullanılamaz.')], ephemeral: true });
      }

      verifyConfig.set(guild.id, { roleId: role.id, channelId: channel.id });

      await interaction.reply({
        embeds: [successEmbed(
          `Doğrulama sistemi kuruldu!\n🎭 Rol: **${role.name}**\n📢 Kanal: ${channel}\n\nDoğrulama mesajını göndermek için \`/verify gönder\` kullan.`,
          '✅ Doğrulama Kuruldu'
        )],
        ephemeral: true,
      });
    }

    if (sub === 'gönder') {
      const config = verifyConfig.get(guild.id);
      if (!config) {
        return interaction.reply({
          embeds: [errorEmbed('Önce `/verify kur` ile sistemi kur.')],
          ephemeral: true,
        });
      }

      const channel = guild.channels.cache.get(config.channelId);
      if (!channel) {
        return interaction.reply({ embeds: [errorEmbed('Doğrulama kanalı bulunamadı.')], ephemeral: true });
      }

      const btn = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('verify_accept')
          .setLabel('✅ Doğrula')
          .setStyle(ButtonStyle.Success),
      );

      await channel.send({
        embeds: [createEmbed({
          type: 'info',
          title: '✅ Sunucu Doğrulaması',
          description: `**${guild.name}** sunucusuna hoş geldin!\n\nSunucuya erişmek için aşağıdaki butona tıkla.`,
          footer: 'Butona tıklayarak kuralları kabul etmiş sayılırsın.',
        })],
        components: [btn],
      });

      await interaction.reply({ content: '✅ Doğrulama mesajı gönderildi.', ephemeral: true });
    }
  },
};
