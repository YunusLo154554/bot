import { SlashCommandBuilder, PermissionFlagsBits, ActivityType } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';

const ACTIVITY_TYPES = {
  playing: ActivityType.Playing,
  streaming: ActivityType.Streaming,
  listening: ActivityType.Listening,
  watching: ActivityType.Watching,
  competing: ActivityType.Competing,
};

export default {
  category: '⚙️ Yönetim',
  cooldown: 10,
  permissions: [PermissionFlagsBits.Administrator],
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Bot durumunu değiştir')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o =>
      o.setName('durum').setDescription('Durum').setRequired(true)
        .addChoices(
          { name: '🟢 Çevrimiçi', value: 'online' },
          { name: '🌙 Boşta', value: 'idle' },
          { name: '🔴 Rahatsız Etme', value: 'dnd' },
          { name: '⚫ Görünmez', value: 'invisible' },
        )
    )
    .addStringOption(o =>
      o.setName('aktivite').setDescription('Aktivite türü').setRequired(false)
        .addChoices(
          { name: '🎮 Oynuyor', value: 'playing' },
          { name: '📺 İzliyor', value: 'watching' },
          { name: '🎵 Dinliyor', value: 'listening' },
          { name: '🏆 Yarışıyor', value: 'competing' },
        )
    )
    .addStringOption(o => o.setName('metin').setDescription('Aktivite metni').setRequired(false)),

  async execute(interaction) {
    const status = interaction.options.getString('durum');
    const actType = interaction.options.getString('aktivite');
    const actText = interaction.options.getString('metin');

    const presence = { status };

    if (actType && actText) {
      presence.activities = [{
        name: actText,
        type: ACTIVITY_TYPES[actType] ?? ActivityType.Playing,
      }];
    } else if (actText) {
      presence.activities = [{ name: actText, type: ActivityType.Playing }];
    }

    interaction.client.user.setPresence(presence);

    await interaction.reply({
      embeds: [successEmbed(
        `Bot durumu güncellendi!\n🔵 Durum: **${status}**${actText ? `\n🎮 Aktivite: **${actText}**` : ''}`,
        '✅ Durum Güncellendi'
      )],
      ephemeral: true,
    });
  },
};
