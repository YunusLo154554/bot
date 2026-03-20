import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';
import { chatMuted } from './chatmute.js';

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageMessages],
  data: new SlashCommandBuilder()
    .setName('unchatmute')
    .setDescription('Kullanıcının chat susturmasını kaldır')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(o => o.setName('kullanici').setDescription('Hedef').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('kullanici');
    const key = `${interaction.channelId}_${target.id}`;

    if (!chatMuted.has(key)) {
      return interaction.reply({ embeds: [errorEmbed('Bu kullanıcı bu kanalda susturulmamış.')], ephemeral: true });
    }

    await interaction.channel.permissionOverwrites.edit(target.id, {
      SendMessages: null,
      AddReactions: null,
    }, { reason: 'Chatmute kaldırıldı' });

    chatMuted.delete(key);

    await interaction.reply({
      embeds: [successEmbed(`**${target.username}**'in chat susturması kaldırıldı.`, '🔊 Chat Unmute')],
    });
  },
};
