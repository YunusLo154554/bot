import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { logger } from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadEvents(client) {
  const eventsPath = join(__dirname, '..', 'events');
  const files = readdirSync(eventsPath).filter(f => f.endsWith('.js'));

  for (const file of files) {
    const filePath = join(eventsPath, file);
    const event = await import(pathToFileURL(filePath).href);
    const { name, once, execute } = event.default;

    if (once) {
      client.once(name, (...args) => execute(...args));
    } else {
      client.on(name, (...args) => execute(...args));
    }

    logger.info(`[EventHandler] Registered event: ${name}`);
  }
}
