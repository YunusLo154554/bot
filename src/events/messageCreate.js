import { afkMap } from '../commands/utility/afk.js';
import { addXP } from '../commands/utility/level.js';
import { antilinkConfig } from '../commands/moderation/antilink.js';
import { anticapsConfig } from '../commands/moderation/anticaps.js';
import { customCmds } from '../commands/utility/customcommands.js';
import { profanityConfig } from '../commands/moderation/profanity-filter.js';
import { spamEnabled, checkSpam } from '../commands/moderation/spam-filter.js';
import { automodConfig } from '../commands/moderation/automod.js';
import { emitLog } from '../utils/logBus.js';
import { infoEmbed, warnEmbed } from '../utils/embed.js';

const URL_REGEX = /https?:\/\/[^\s]+|discord\.gg\/[^\s]+|www\.[^\s]+/i;
const INVITE_REGEX = /discord\.gg\/[^\s]+|discord\.com\/invite\/[^\s]+/i;
const lastMessages = new Map(); // userId -> last content (duplicate check)

export default {
  name: 'messageCreate',
  once: false,
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const gid = message.guild.id;
    const member = message.member;

    // ── Mesaj logu (dashboard) ────────────────────────────────────────────────
    emitLog({
      guild: gid,
      user: message.author.username,
      action: `#${message.channel.name}: ${message.content.slice(0, 80)}${message.content.length > 80 ? '…' : ''}`,
      type: 'message',
    });

    // ── Profanity Filter ──────────────────────────────────────────────────────
    const pfCfg = profanityConfig.get(gid);
    if (pfCfg?.enabled) {
      const lower = message.content.toLowerCase();
      const hit = [...pfCfg.words].find(w => lower.includes(w));
      if (hit && !member?.permissions.has('ManageMessages')) {
        await message.delete().catch(() => null);
        const warn = await message.channel.send({
          content: `${message.author}`,
          embeds: [warnEmbed('Yasaklı kelime kullandın!', '🔞 Küfür Filtresi')],
        });
        setTimeout(() => warn.delete().catch(() => null), 5000);
        emitLog({ guild: gid, user: message.author.username, action: `Küfür filtresi: "${hit}"`, type: 'automod' });
        return;
      }
    }

    // ── Antilink ──────────────────────────────────────────────────────────────
    const alCfg = antilinkConfig.get(gid);
    if (alCfg?.enabled && URL_REGEX.test(message.content)) {
      // Whitelist kanal kontrolü
      if (!alCfg.whitelist.has(message.channelId)) {
        // Yöneticiler ve ManageMessages izni olanlar muaf
        if (!member?.permissions.has('ManageMessages')) {
          await message.delete().catch(() => null);
          const warn = await message.channel.send({
            content: `${message.author}`,
            embeds: [warnEmbed('Bu kanalda link paylaşmak yasak!', '🔗 Antilink')],
          });
          setTimeout(() => warn.delete().catch(() => null), 5000);
          emitLog({ guild: gid, user: message.author.username, action: `Antilink: link silindi`, type: 'automod' });
          return;
        }
      }
    }

    // ── Anticaps ──────────────────────────────────────────────────────────────
    const acCfg = anticapsConfig.get(gid);
    if (acCfg?.enabled && message.content.length >= acCfg.minLength) {
      const letters = message.content.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, '');
      if (letters.length > 0) {
        const upperCount = (message.content.match(/[A-ZĞÜŞİÖÇ]/g) ?? []).length;
        const ratio = (upperCount / letters.length) * 100;
        if (ratio >= acCfg.threshold) {
          if (!member?.permissions.has('ManageMessages')) {
            await message.delete().catch(() => null);
            const warn = await message.channel.send({
              content: `${message.author}`,
              embeds: [warnEmbed(`Çok fazla büyük harf kullandın! (%${Math.floor(ratio)})`, '🔠 Anticaps')],
            });
            setTimeout(() => warn.delete().catch(() => null), 5000);
            emitLog({ guild: gid, user: message.author.username, action: `Anticaps: %${Math.floor(ratio)} büyük harf`, type: 'automod' });
            return;
          }
        }
      }
    }

    // ── Spam Filtresi ─────────────────────────────────────────────────────────
    if (spamEnabled.get(gid) && !member?.permissions.has('ManageMessages')) {
      const spamStatus = checkSpam(message.author.id);
      if (spamStatus === 'spam' || spamStatus === 'timeout') {
        await message.delete().catch(() => null);
        const warn = await message.channel.send({
          content: `${message.author}`,
          embeds: [warnEmbed('Spam tespit edildi! Yavaşla.', '🚫 Spam Filtresi')],
        });
        setTimeout(() => warn.delete().catch(() => null), 5000);
        emitLog({ guild: gid, user: message.author.username, action: `Spam filtresi tetiklendi`, type: 'automod' });
        return;
      }
    }

    // ── Automod ───────────────────────────────────────────────────────────────
    const amCfg = automodConfig.get(gid);
    if (amCfg?.enabled && !member?.permissions.has('ManageMessages')) {
      // Mention spam
      if (amCfg.mentionLimit && message.mentions.users.size >= amCfg.mentionLimit) {
        await message.delete().catch(() => null);
        const warn = await message.channel.send({
          content: `${message.author}`,
          embeds: [warnEmbed(`Çok fazla mention! (${message.mentions.users.size}/${amCfg.mentionLimit})`, '🤖 Automod')],
        });
        setTimeout(() => warn.delete().catch(() => null), 5000);
        emitLog({ guild: gid, user: message.author.username, action: `Automod: mention spam (${message.mentions.users.size})`, type: 'automod' });
        return;
      }
      // Davet linki engeli
      if (amCfg.inviteBlock && INVITE_REGEX.test(message.content)) {
        await message.delete().catch(() => null);
        const warn = await message.channel.send({
          content: `${message.author}`,
          embeds: [warnEmbed('Discord davet linkleri yasak!', '🤖 Automod')],
        });
        setTimeout(() => warn.delete().catch(() => null), 5000);
        emitLog({ guild: gid, user: message.author.username, action: `Automod: davet linki engellendi`, type: 'automod' });
        return;
      }
      // Tekrar mesaj
      if (amCfg.duplicateMsg) {
        const lastKey = `${message.author.id}:${gid}`;
        const last = lastMessages.get(lastKey);
        if (last && last === message.content.trim() && message.content.trim().length > 3) {
          await message.delete().catch(() => null);
          const warn = await message.channel.send({
            content: `${message.author}`,
            embeds: [warnEmbed('Aynı mesajı tekrar gönderme!', '🤖 Automod')],
          });
          setTimeout(() => warn.delete().catch(() => null), 5000);
          emitLog({ guild: gid, user: message.author.username, action: `Automod: tekrar mesaj engellendi`, type: 'automod' });
          lastMessages.delete(lastKey);
          return;
        }
        lastMessages.set(lastKey, message.content.trim());
        setTimeout(() => lastMessages.delete(lastKey), 10000);
      }
    }

    // ── AFK: Mesaj yazan kişi AFK'daysa kaldır ────────────────────────────────
    if (afkMap.has(message.author.id)) {
      const { since } = afkMap.get(message.author.id);
      afkMap.delete(message.author.id);
      const elapsed = Math.floor((Date.now() - since) / 1000);
      message.reply({
        embeds: [infoEmbed(`AFK modu otomatik kapatıldı. **${elapsed}s** AFK'daydın.`, '👋 Hoş Geldin')],
      }).catch(() => null);
    }

    // ── AFK: Mention edilen biri AFK'daysa bildir ─────────────────────────────
    for (const user of message.mentions.users.values()) {
      if (afkMap.has(user.id)) {
        const { reason, since } = afkMap.get(user.id);
        const elapsed = Math.floor((Date.now() - since) / 1000);
        message.reply({
          embeds: [infoEmbed(
            `**${user.username}** şu an AFK.\n📝 Sebep: ${reason}\n⏱️ ${elapsed}s önce`,
            '💤 Kullanıcı AFK'
          )],
        }).catch(() => null);
      }
    }

    // ── Level XP ──────────────────────────────────────────────────────────────
    const newLevel = addXP(message.author.id, gid, message.client);
    if (newLevel !== null) {
      message.channel.send({
        embeds: [infoEmbed(
          `${message.author} seviye atladı! 🎉 Yeni seviye: **${newLevel}**`,
          '⭐ Level Up!'
        )],
      }).catch(() => null);
    }

    // ── Custom Commands ───────────────────────────────────────────────────────
    const guildCmds = customCmds.get(gid);
    if (guildCmds?.size) {
      const content = message.content.toLowerCase().trim();
      const cmd = guildCmds.get(content);
      if (cmd) {
        await message.channel.send(cmd.response).catch(() => null);
      }
    }
  },
};
