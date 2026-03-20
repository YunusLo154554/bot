import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { config } from 'dotenv';
import { loadCommands } from './src/handlers/commandHandler.js';
import { loadEvents } from './src/handlers/eventHandler.js';
import { logger } from './src/utils/logger.js';
import { setupGiveawayListener } from './src/commands/fun/giveaway.js';
import { startDashboard } from './dashboard/server.js';

config();

const { DISCORD_TOKEN } = process.env;

if (!DISCORD_TOKEN) {
  logger.error('DISCORD_TOKEN bulunamadı. .env dosyasını kontrol et.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,       // Privileged — Portal'dan aç
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,     // Privileged — Portal'dan aç
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.GuildMember, Partials.Channel, Partials.Message],
});

await loadCommands(client);
await loadEvents(client);
setupGiveawayListener(client);

process.on('unhandledRejection', err => logger.error(`Unhandled rejection: ${err}`));
process.on('uncaughtException', err => { logger.error(`Uncaught exception: ${err}`); process.exit(1); });

const shutdown = () => { logger.info('Bot kapatılıyor...'); client.destroy(); process.exit(0); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

client.once('ready', () => startDashboard(client));

await client.login(DISCORD_TOKEN);
