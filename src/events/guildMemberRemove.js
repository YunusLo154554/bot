import { logger } from '../utils/logger.js';
import { goodbyeConfig } from '../commands/utility/goodbye.js';

export default {
  name: 'guildMemberRemove',
  once: false,
  async execute(member) {
    const guild = member.guild;
    logger.info(`[Guild] ${member.user.username} left ${guild.name}`);

    const cfg = goodbyeConfig.get(guild.id);
    if (!cfg?.enabled) return;

    const ch = guild.channels.cache.get(cfg.channelId);
    if (!ch) return;

    const text = cfg.message
      .replace('{user}', member.user.username)
      .replace('{server}', guild.name)
      .replace('{count}', guild.memberCount);

    await ch.send(text).catch(() => null);
  },
};
