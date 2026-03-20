import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, infoEmbed } from '../../utils/embed.js';

// guildId -> { enabled, words: Set<string>, action: 'delete'|'warn'|'mute' }
export const profanityConfig = new Map();

const DEFAULT_WORDS = [
  'bok', 'sik', 'orospu', 'piç', 'göt', 'am', 'amk', 'aq', 'oç', 'ibne',
  'salak', 'aptal', 'gerizekalı', 'mal', 'dangalak',
];

export function checkProfanity(guildId, content) {
  const cfg = profanityConfig.get(guildId);
  if (!cfg?.enabled) return false;
  const lower = content.toLowerCase();
  for (const word of cfg.words) {
    if (lower.includes(word)) return true;
  }
  return false;
}

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('profanity-filter')
    .setDescription('Küfür filtresini yönet')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName('aç').setDescription('Küfür filtresini etkinleştir'))
    .addSubcommand(s => s.setName('kapat').setDescription('Küfür filtresini devre dışı bırak'))
    .addSubcommand(s =>
      s.setName('ekle').setDescription('Yasaklı kelime ekle')
        .addStringOption(o => o.setName('kelime').setDescription('Kelime').setRequired(true))
    )
    .addSubcommand(s =>
      s.setName('sil').setDescription('Yasaklı kelime sil')
        .addStringOption(o => o.setName('kelime').setDescription('Kelime').setRequired(true))
    )
    .addSubcommand(s => s.setName('liste').setDescription('Yasaklı kelimeleri listele'))
    .addSubcommand(s => s.setName('durum').setDescription('Filtre durumunu göster')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (!profanityConfig.has(gid)) {
      profanityConfig.set(gid, { enabled: false, words: new Set(DEFAULT_WORDS) });
    }
    const cfg = profanityConfig.get(gid);

    if (sub === 'aç') {
      cfg.enabled = true;
      return interaction.reply({ embeds: [successEmbed('Küfür filtresi etkinleştirildi.', '🔞 Profanity Filter Açık')] });
    }
    if (sub === 'kapat') {
      cfg.enabled = false;
      return interaction.reply({ embeds: [successEmbed('Küfür filtresi devre dışı bırakıldı.', '🔞 Profanity Filter Kapalı')] });
    }
    if (sub === 'ekle') {
      const word = interaction.options.getString('kelime').toLowerCase();
      cfg.words.add(word);
      return interaction.reply({ embeds: [successEmbed(`\`${word}\` yasaklı kelimeler listesine eklendi.`)] });
    }
    if (sub === 'sil') {
      const word = interaction.options.getString('kelime').toLowerCase();
      cfg.words.delete(word);
      return interaction.reply({ embeds: [successEmbed(`\`${word}\` listeden kaldırıldı.`)] });
    }
    if (sub === 'liste') {
      const list = [...cfg.words].join(', ') || 'Liste boş';
      return interaction.reply({ embeds: [infoEmbed(`**Yasaklı Kelimeler:**\n${list}`, '🔞 Profanity Liste')], ephemeral: true });
    }
    if (sub === 'durum') {
      return interaction.reply({
        embeds: [infoEmbed(`**Durum:** ${cfg.enabled ? '✅ Açık' : '❌ Kapalı'}\n**Kelime Sayısı:** ${cfg.words.size}`, '🔞 Profanity Durumu')],
      });
    }
  },
};
