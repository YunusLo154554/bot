import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';

// channelId_userId -> true
export const chatMuted = new Map();

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageMessages],
  data: new SlashCommandBuilder()
    .setName('chatmute')
    .setDescription('Kullanıcıyı bu kanalda sustur')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(o => o.setName('kullanici').setDescription('Hedef').setRequired(true))
    .addStringOption(o => o.setName('sebep').setDescription('Sebep').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('kullanici');
    const reason = interaction.options.getString('sebep') ?? 'Sebep belirtilmedi';
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) return interaction.reply({ embeds: [errorEmbed('Kullanıcı bulunamadı.')], ephemeral: true });

    await interaction.channel.permissionOverwrites.edit(target.id, {
      SendMessages: false,
      AddReactions: false,
    }, { reason: `Chatmute: ${reason}` });

    chatMuted.set(`${interaction.channelId}_${target.id}`, true);

    await interaction.reply({
      embeds: [successEmbed(
        `**${target.username}** bu kanalda susturuldu.\n📝 Sebep: ${reason}`,
        '🔇 Chat Mute'
      )],
    });
  },
};
