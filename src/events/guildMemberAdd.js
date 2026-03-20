import { infoEmbed } from '../utils/embed.js';
import { logger } from '../utils/logger.js';
import { autoroleMap } from '../commands/utility/autorole.js';
import { welcomeConfig } from '../commands/utility/welcome.js';
import { antiraidConfig, joinLog } from '../commands/moderation/antiraid.js';
import { PermissionFlagsBits } from 'discord.js';

export default {
  name: 'guildMemberAdd',
  once: false,
  async execute(member) {
    const guild = member.guild;
    const gid = guild.id;
    logger.info(`[Guild] ${member.user.username} joined ${guild.name}`);

    // ── Antiraid ──────────────────────────────────────────────────────────────
    const raidCfg = antiraidConfig.get(gid);
    if (raidCfg?.enabled) {
      if (!joinLog.has(gid)) joinLog.set(gid, []);
      const log = joinLog.get(gid);
      const now = Date.now();
      log.push(now);

      // Pencere dışındaki kayıtları temizle
      const window = raidCfg.joinWindow ?? 10000;
      const recent = log.filter(t => now - t < window);
      joinLog.set(gid, recent);

      if (recent.length >= raidCfg.joinThreshold) {
        logger.warn(`[Antiraid] Raid tespit edildi! ${guild.name} — ${recent.length} kişi/${window / 1000}sn`);
        try {
          if (raidCfg.action === 'kick') await member.kick('Antiraid: Raid tespit edildi');
          else if (raidCfg.action === 'ban') await guild.bans.create(member.id, { reason: 'Antiraid: Raid tespit edildi' });
          else if (raidCfg.action === 'timeout') {
            await member.timeout(600000, 'Antiraid: Raid tespit edildi');
          }
        } catch (err) {
          logger.warn(`[Antiraid] Aksiyon alınamadı: ${err.message}`);
        }
        return; // Welcome/autorole atla
      }
    }

    // ── Autorole ──────────────────────────────────────────────────────────────
    const roleId = autoroleMap.get(gid);
    if (roleId) {
      const role = guild.roles.cache.get(roleId);
      if (role) {
        await member.roles.add(role).catch(err =>
          logger.warn(`[Autorole] Rol verilemedi: ${err.message}`)
        );
      }
    }

    // ── Welcome (özel config) ─────────────────────────────────────────────────
    const welcomeCfg = welcomeConfig.get(gid);
    if (welcomeCfg?.enabled) {
      const ch = guild.channels.cache.get(welcomeCfg.channelId);
      if (ch) {
        const text = welcomeCfg.message
          .replace('{user}', `${member}`)
          .replace('{server}', guild.name)
          .replace('{count}', guild.memberCount);
        await ch.send(text).catch(() => null);
        return;
      }
    }

    // ── Fallback: varsayılan hoşgeldin ────────────────────────────────────────
    const channel = guild.channels.cache.find(c =>
      ['genel', 'general', 'welcome', 'hoşgeldin', 'hosgeldin'].includes(c.name.toLowerCase()) &&
      c.isTextBased()
    );
    if (!channel) return;

    const embed = infoEmbed(
      `Sunucumuza hoş geldin, ${member}! 🎉\nToplam üye: **${guild.memberCount}**`,
      '👋 Yeni Üye'
    ).setThumbnail(member.user.displayAvatarURL({ dynamic: true }));

    await channel.send({ embeds: [embed] }).catch(() => null);
  },
};
