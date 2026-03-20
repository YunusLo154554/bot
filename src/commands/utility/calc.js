import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embed.js';

export default {
  category: '⚙️ Yönetim',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('calc')
    .setDescription('Basit matematik hesapla')
    .addStringOption(opt =>
      opt.setName('işlem').setDescription('Örnek: 2 + 2, 10 * 5, 100 / 4').setRequired(true)
    ),

  async execute(interaction) {
    const expr = interaction.options.getString('işlem');

    // Sadece sayı ve operatörlere izin ver — eval injection önlemi
    if (!/^[\d\s+\-*/().%]+$/.test(expr)) {
      return interaction.reply({
        embeds: [createEmbed({ type: 'error', title: '❌ Geçersiz İfade', description: 'Sadece sayı ve `+ - * / ( ) %` kullanabilirsin.' })],
        ephemeral: true,
      });
    }

    let result;
    try {
      // eslint-disable-next-line no-new-func
      result = Function(`"use strict"; return (${expr})`)();
      if (!isFinite(result)) throw new Error('Sonsuz sonuç');
    } catch {
      return interaction.reply({
        embeds: [createEmbed({ type: 'error', title: '❌ Hesaplama Hatası', description: 'Geçersiz matematiksel ifade.' })],
        ephemeral: true,
      });
    }

    await interaction.reply({
      embeds: [createEmbed({
        type: 'success',
        title: '🧮 Hesap Makinesi',
        fields: [
          { name: '📥 İşlem', value: `\`${expr}\``, inline: true },
          { name: '📤 Sonuç', value: `\`${result}\``, inline: true },
        ],
      })],
    });
  },
};
