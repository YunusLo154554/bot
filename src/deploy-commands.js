import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { config } from 'dotenv';

config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('❌ DISCORD_TOKEN ve CLIENT_ID .env dosyasında tanımlı olmalı');
  process.exit(1);
}

const commands = [];
const commandsPath = join(__dirname, 'commands');

for (const category of readdirSync(commandsPath)) {
  const files = readdirSync(join(commandsPath, category)).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const cmd = await import(pathToFileURL(join(commandsPath, category, file)).href);
    if (cmd.default?.data) commands.push(cmd.default.data.toJSON());
  }
}

const rest = new REST().setToken(DISCORD_TOKEN);

try {
  console.log(`📡 ${commands.length} slash command deploy ediliyor...`);

  // Guild deploy = instant (dev), global deploy = up to 1 hour
  const route = GUILD_ID
    ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
    : Routes.applicationCommands(CLIENT_ID);

  await rest.put(route, { body: commands });

  console.log(`✅ ${commands.length} komut başarıyla deploy edildi (${GUILD_ID ? 'Guild' : 'Global'})`);
} catch (err) {
  console.error('❌ Deploy hatası:', err);
}
