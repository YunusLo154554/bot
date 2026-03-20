import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed } from '../../utils/embed.js';

// guildId -> bool
export const spamEnabled = new Map();

// Spam tracking: userId -> { count, lastMessage, timeout }
const spamTracker = new Map();
const SPAM_THRESHOLD = 5;
const SPAM_WINDOW = 5000;
const SPAM_COOLDOWN = 60000;

export function checkSpam(userId) {
  const now = Date.now();
  
  if (!spamTracker.has(userId)) {
    spamTracker.set(userId, { count: 1, lastMessage: now, timeout: null });
    return null;
  }

  const user = spamTracker.get(userId);

  if (user.timeout && now < user.timeout) return 'timeout';

  if (now - user.lastMessage > SPAM_WINDOW) {
    user.count = 1;
    user.lastMessage = now;
    user.timeout = null;
    return null;
  }

  user.count++;
  user.lastMessage = now;

  if (user.count >= SPAM_THRESHOLD) {
    user.timeout = now + SPAM_COOLDOWN;
    return 'spam';
  }

  return null;
}

export default {
  category: '🔨 Moderasyon',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageMessages],
  data: new SlashCommandBuilder()
    .setName('spam-filter')
    .setDescription('Spam filtresini aç/kapat')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addBooleanOption(opt =>
      opt.setName('aktif').setDescription('Filtreyi aç/kapat').setRequired(true)
    ),

  async execute(interaction) {
    const enabled = interaction.options.getBoolean('aktif');
    spamEnabled.set(interaction.guild.id, enabled);
    await interaction.reply({
      embeds: [successEmbed(
        `Spam filtresi **${enabled ? 'açıldı' : 'kapatıldı'}**.\n(${SPAM_THRESHOLD} mesaj / ${SPAM_WINDOW}ms)`,
        '🚫 Spam Filter'
      )],
    });
  },
};
