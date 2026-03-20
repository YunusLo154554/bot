import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, errorEmbed, createEmbed } from '../../utils/embed.js';

export default {
  category: '⚙️ Yönetim',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Hatırlatıcı kur')
    .addStringOption(opt =>
      opt.setName('mesaj').setDescription('Hatırlatıcı mesajı').setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('dakika').setDescription('Kaç dakika sonra? (1-1440)').setRequired(true).setMinValue(1).setMaxValue(1440)
    ),

  async execute(interaction) {
    const message = interaction.options.getString('mesaj');
    const minutes = interaction.options.getInteger('dakika');
    const ms = minutes * 60 * 1000;

    await interaction.reply({
      embeds: [successEmbed(
        `**${minutes} dakika** sonra seni hatırlatacağım.\n📝 Not: ${message}`,
        '⏰ Hatırlatıcı Kuruldu'
      )],
      ephemeral: true,
    });

    setTimeout(async () => {
      try {
        await interaction.user.send({
          embeds: [createEmbed({
            type: 'warning',
            title: '⏰ Hatırlatıcı!',
            description: message,
            footer: `${interaction.guild?.name ?? 'Discord'} sunucusundan`,
          })],
        });
      } catch {
        // DM kapalıysa kanala gönder
        await interaction.channel?.send({
          content: `${interaction.user} ⏰ Hatırlatıcın: **${message}**`,
        }).catch(() => null);
      }
    }, ms);
  },
};
