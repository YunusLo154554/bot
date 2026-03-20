import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Collection } from 'discord.js';
import { logger } from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadCommands(client) {
  client.commands = new Collection();
  const commandsPath = join(__dirname, '..', 'commands');
  const categories = readdirSync(commandsPath);

  let loaded = 0;

  for (const category of categories) {
    const categoryPath = join(commandsPath, category);
    const files = readdirSync(categoryPath).filter(f => f.endsWith('.js'));

    for (const file of files) {
      const filePath = join(categoryPath, file);
      const command = await import(pathToFileURL(filePath).href);

      if (!command.default?.data || !command.default?.execute) {
        logger.warn(`[CommandHandler] Skipping ${file} — missing data or execute export`);
        continue;
      }

      client.commands.set(command.default.data.name, command.default);
      loaded++;
    }
  }

  logger.info(`[CommandHandler] Loaded ${loaded} commands`);
}
