import { EmbedBuilder } from 'discord.js';

const COLORS = {
  success: 0x57f287,
  error: 0xed4245,
  warning: 0xfee75c,
  info: 0x5865f2,
  neutral: 0x2b2d31,
};

/**
 * Creates a styled embed with consistent branding
 */
export function createEmbed({ type = 'info', title, description, fields = [], footer, thumbnail }) {
  const embed = new EmbedBuilder()
    .setColor(COLORS[type])
    .setTimestamp();

  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (fields.length) embed.addFields(fields);
  if (footer) embed.setFooter({ text: footer });
  if (thumbnail) embed.setThumbnail(thumbnail);

  return embed;
}

export function successEmbed(description, title = '✅ Başarılı') {
  return createEmbed({ type: 'success', title, description });
}

export function errorEmbed(description, title = '❌ Hata') {
  return createEmbed({ type: 'error', title, description });
}

export function infoEmbed(description, title) {
  return createEmbed({ type: 'info', title, description });
}

export function warnEmbed(description, title = '⚠️ Uyarı') {
  return createEmbed({ type: 'warning', title, description });
}
