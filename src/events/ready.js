import { ActivityType } from 'discord.js';
import { logger } from '../utils/logger.js';

export default {
  name: 'clientReady',
  once: true,
  execute(client) {
    logger.info(`[Bot] Logged in as ${client.user.username}`);
    logger.info(`[Bot] Serving ${client.guilds.cache.size} guilds`);

    const activities = [
      { name: '/help | Komutlar için', type: ActivityType.Watching },
      { name: `${client.guilds.cache.size} sunucu`, type: ActivityType.Watching },
      { name: 'YunusLo1545 Community', type: ActivityType.Playing },
    ];

    let i = 0;
    const rotate = () => {
      client.user.setActivity(activities[i % activities.length]);
      i++;
    };

    rotate();
    setInterval(rotate, 15_000);
  },
};
