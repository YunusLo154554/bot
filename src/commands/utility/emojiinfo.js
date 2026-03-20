import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, errorEmbed } from '../../utils/embed.js';

export default {
  category: '🔧 Araçlar',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('emojiinfo')
    .setDescription('Sunucu emojisi hakkında bilgi göster')
    .addStringOption(o => o.setName('emoji').setDescription('Emoji (sunucu emojisi)').setRequired(true)),

  async execute(interaction) {
    const input = interaction.options.getString('emoji').trim();

    // Custom emoji parse: <:name:id> veya <a:name:id>
    const match = input.match(/^<(a?):(\w+):(\d+)>$/);
    if (!match) {
      return interaction.reply({ embeds: [errorEmbed('Geçerli bir sunucu emojisi gir. (Örn: :emoji:)')], ephemeral: true });
    }

    const [, animated, name, id] = match;
    const ext = animated ? 'gif' : 'png';
    const url = `https://cdn.discordapp.com/emojis/${id}.${ext}?size=256`;

    const guildEmoji = interaction.guild.emojis.cache.get(id);

    await interaction.reply({
      embeds: [createEmbed({
        type: 'info',
        title: `:${name}: Emoji Bilgisi`,
        thumbnail: url,
        fields: [
          { name: '🆔 ID', value: id, inline: true },
          { name: '📛 İsim', value: name, inline: true },
          { name: '🎞️ Animasyonlu', value: animated ? 'Evet' : 'Hayır', inline: true },
          { name: '📅 Eklenme', value: guildEmoji ? `<t:${Math.floor(guildEmoji.createdTimestamp / 1000)}:D>` : 'Bilinmiyor', inline: true },
          { name: '👤 Ekleyen', value: guildEmoji?.author ? `<@${guildEmoji.author.id}>` : 'Bilinmiyor', inline: true },
          { name: '🔗 URL', value: `[Aç](${url})`, inline: true },
        ],
      })],
    });
  },
};
