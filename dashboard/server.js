import { createServer } from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createHash } from 'crypto';
import { onLog } from '../src/utils/logBus.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 5733;

// ─── In-memory veri deposu ────────────────────────────────────────────────────
export const dashboardData = {
  client: null,
  startedAt: Date.now(),
};

// ─── Moderation config referansları ──────────────────────────────────────────
export const modConfigs = {
  anticapsConfig: null,
  antilinkConfig: null,
  antiraidConfig: null,
  automodConfig: null,
  profanityConfig: null,
  spamEnabled: new Map(),
};

// ─── Log buffer (son 200 log) ─────────────────────────────────────────────────
export const logBuffer = [];

export function pushLog(entry) {
  const client = dashboardData.client;
  const guildName = client?.guilds.cache.get(entry.guild)?.name ?? entry.guild ?? '—';
  const full = { ...entry, guildName, ts: Date.now() };
  logBuffer.push(full);
  if (logBuffer.length > 200) logBuffer.shift();
  broadcastLog(full);
}

function broadcastLog(entry) {
  if (!wsClients.size) return;
  const msg = JSON.stringify({ type: 'log', data: entry });
  for (const ws of wsClients) {
    try { ws.write(buildWsFrame(msg)); } catch { wsClients.delete(ws); }
  }
}

// ─── WebSocket broadcast ──────────────────────────────────────────────────────
const wsClients = new Set();

export function broadcastStats() {
  if (!wsClients.size || !dashboardData.client) return;
  const payload = buildStatsPayload();
  const msg = JSON.stringify({ type: 'stats', data: payload });
  for (const ws of wsClients) {
    try { ws.write(buildWsFrame(msg)); } catch { wsClients.delete(ws); }
  }
}

function buildUsageFromData(data) {
  try {
    const opts = data.options ?? [];
    const parts = [`/${data.name}`];
    for (const opt of opts) {
      // Subcommand
      if (opt.type === 1) {
        const subParts = [`/${data.name} ${opt.name}`];
        for (const sub of (opt.options ?? [])) {
          const req = sub.required;
          subParts.push(req ? `<${sub.name}>` : `[${sub.name}]`);
        }
        return subParts.join(' ');
      }
      // Subcommand group
      if (opt.type === 2) return `/${data.name} <grup> <alt-komut>`;
      // Normal option
      const req = opt.required;
      parts.push(req ? `<${opt.name}>` : `[${opt.name}]`);
    }
    return parts.join(' ');
  } catch { return `/${data.name}`; }
}

function buildStatsPayload() {
  const client = dashboardData.client;
  if (!client?.isReady()) return {};
  const uptime = process.uptime();
  const mem = process.memoryUsage();
  return {
    botName: client.user.username,
    botAvatar: client.user.displayAvatarURL({ size: 128 }),
    botId: client.user.id,
    ping: client.ws.ping,
    guilds: client.guilds.cache.size,
    totalMembers: client.guilds.cache.reduce((a, g) => a + g.memberCount, 0),
    commands: client.commands?.size ?? 0,
    uptime: Math.floor(uptime),
    memMB: (mem.heapUsed / 1024 / 1024).toFixed(1),
    nodeVersion: process.version,
    guildsDetail: client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      icon: g.iconURL({ size: 64 }) ?? null,
      members: g.memberCount,
      channels: g.channels.cache.size,
      roles: g.roles.cache.size,
    })),
    commandsList: [...(client.commands?.values() ?? [])].map(c => ({
      name: c.data.name,
      description: c.data.description,
      category: c.category ?? '⚙️ Yönetim',
      cooldown: c.cooldown ?? 3,
      usage: c.usage ?? buildUsageFromData(c.data),
    })),
  };
}

// ─── WebSocket handshake ──────────────────────────────────────────────────────
function wsHandshake(req, socket) {
  const key = req.headers['sec-websocket-key'];
  const accept = createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  );
  wsClients.add(socket);
  socket.on('close', () => wsClients.delete(socket));
  socket.on('error', () => wsClients.delete(socket));
  setTimeout(() => {
    try {
      const msg = JSON.stringify({ type: 'stats', data: buildStatsPayload() });
      socket.write(buildWsFrame(msg));
    } catch { wsClients.delete(socket); }
  }, 200);
}

function buildWsFrame(data) {
  const payload = Buffer.from(data, 'utf8');
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81;
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}

// ─── Moderasyon işlemleri ─────────────────────────────────────────────────────
async function handleModAction(action, payload) {
  const client = dashboardData.client;
  if (!client?.isReady()) return { ok: false, error: 'Bot hazır değil' };
  const guild = client.guilds.cache.get(payload.guildId);
  if (!guild) return { ok: false, error: 'Sunucu bulunamadı' };

  try {
    if (action === 'ban') {
      const member = await guild.members.fetch(payload.userId).catch(() => null);
      if (!member) return { ok: false, error: 'Kullanıcı bulunamadı' };
      if (!guild.members.me?.permissions.has('BanMembers'))
        return { ok: false, error: 'Botun "Ban Members" yetkisi yok' };
      if (member.roles.highest.position >= guild.members.me.roles.highest.position)
        return { ok: false, error: 'Hedef kullanıcının rolü bottan yüksek veya eşit' };
      await member.ban({ reason: payload.reason || 'Dashboard üzerinden ban' });
      return { ok: true, message: `${member.user.username} banlandı` };
    }

    if (action === 'kick') {
      const member = await guild.members.fetch(payload.userId).catch(() => null);
      if (!member) return { ok: false, error: 'Kullanıcı bulunamadı' };
      if (!guild.members.me?.permissions.has('KickMembers'))
        return { ok: false, error: 'Botun "Kick Members" yetkisi yok' };
      if (member.roles.highest.position >= guild.members.me.roles.highest.position)
        return { ok: false, error: 'Hedef kullanıcının rolü bottan yüksek veya eşit' };
      await member.kick(payload.reason || 'Dashboard üzerinden kick');
      return { ok: true, message: `${member.user.username} kicklendi` };
    }

    if (action === 'mute') {
      const member = await guild.members.fetch(payload.userId).catch(() => null);
      if (!member) return { ok: false, error: 'Kullanıcı bulunamadı' };
      if (!guild.members.me?.permissions.has('ModerateMembers'))
        return { ok: false, error: 'Botun "Moderate Members" yetkisi yok' };
      if (member.roles.highest.position >= guild.members.me.roles.highest.position)
        return { ok: false, error: 'Hedef kullanıcının rolü bottan yüksek veya eşit' };
      if (!member.moderatable)
        return { ok: false, error: 'Bu kullanıcı mute edilemiyor' };
      const ms = (parseInt(payload.duration) || 10) * 60 * 1000;
      await member.timeout(ms, payload.reason || 'Dashboard üzerinden mute');
      return { ok: true, message: `${member.user.username} ${payload.duration || 10} dakika mute edildi` };
    }

    if (action === 'warn') {
      const member = await guild.members.fetch(payload.userId).catch(() => null);
      if (!member) return { ok: false, error: 'Kullanıcı bulunamadı' };
      await member.send(`⚠️ **Uyarı aldınız:** ${payload.reason || 'Sebep belirtilmedi'}`).catch(() => {});
      return { ok: true, message: `${member.user.username} uyarıldı` };
    }

    if (action === 'clear') {
      const channel = guild.channels.cache.get(payload.channelId);
      if (!channel) return { ok: false, error: 'Kanal bulunamadı' };
      const amount = Math.min(parseInt(payload.amount) || 10, 100);
      const deleted = await channel.bulkDelete(amount, true);
      return { ok: true, message: `${deleted.size} mesaj silindi` };
    }

    if (action === 'unban') {
      await guild.members.unban(payload.userId, 'Dashboard üzerinden unban');
      return { ok: true, message: 'Kullanıcının banı kaldırıldı' };
    }

    return { ok: false, error: 'Bilinmeyen işlem' };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ─── HTTP sunucu ──────────────────────────────────────────────────────────────
function readBody(req) {
  return new Promise(resolve => {
    let data = '';
    req.on('data', d => data += d);
    req.on('end', () => resolve(data));
  });
}

export async function startDashboard(client) {
  dashboardData.client = client;

  // Moderation config referanslarını bağla
  const { anticapsConfig }  = await import('../src/commands/moderation/anticaps.js');
  const { antilinkConfig }  = await import('../src/commands/moderation/antilink.js');
  const { antiraidConfig }  = await import('../src/commands/moderation/antiraid.js');
  const { automodConfig }   = await import('../src/commands/moderation/automod.js');
  const { profanityConfig } = await import('../src/commands/moderation/profanity-filter.js');
  const { spamEnabled }     = await import('../src/commands/moderation/spam-filter.js');

  modConfigs.anticapsConfig  = anticapsConfig;
  modConfigs.antilinkConfig  = antilinkConfig;
  modConfigs.antiraidConfig  = antiraidConfig;
  modConfigs.automodConfig   = automodConfig;
  modConfigs.profanityConfig = profanityConfig;
  modConfigs.spamEnabled     = spamEnabled;

  // logBus'tan gelen logları yakala
  onLog(entry => pushLog(entry));

  const server = createServer((req, res) => {
    handleRequest(req, res).catch(e => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    });
  });

  async function handleRequest(req, res) {
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

    if (req.url === '/api/stats') {
      res.writeHead(200, headers);
      return res.end(JSON.stringify(buildStatsPayload()));
    }

    // Üye listesi: /api/guild/:guildId/members?q=arama
    const membersMatch = req.url?.match(/^\/api\/guild\/(\d+)\/members(\?.*)?$/);
    if (membersMatch) {
      const guild = dashboardData.client?.guilds.cache.get(membersMatch[1]);
      if (!guild) { res.writeHead(404, headers); return res.end(JSON.stringify({ error: 'Sunucu bulunamadı' })); }
      const q = new URLSearchParams(membersMatch[2]?.slice(1) ?? '').get('q')?.toLowerCase() ?? '';
      await guild.members.fetch({ limit: 100 }).catch(() => {});
      const members = guild.members.cache
        .filter(m => !m.user.bot && (!q || m.user.username.toLowerCase().includes(q) || m.displayName.toLowerCase().includes(q)))
        .first(50)
        .map(m => ({ id: m.id, username: m.user.username, displayName: m.displayName, avatar: m.user.displayAvatarURL({ size: 32 }) }));
      res.writeHead(200, headers);
      return res.end(JSON.stringify(members));
    }

    // Kanal listesi: /api/guild/:guildId/channels
    const channelsMatch = req.url?.match(/^\/api\/guild\/(\d+)\/channels$/);
    if (channelsMatch) {
      const guild = dashboardData.client?.guilds.cache.get(channelsMatch[1]);
      if (!guild) { res.writeHead(404, headers); return res.end(JSON.stringify({ error: 'Sunucu bulunamadı' })); }
      const channels = guild.channels.cache
        .filter(c => c.type === 0)
        .map(c => ({ id: c.id, name: c.name }))
        .sort((a, b) => a.name.localeCompare(b.name));
      res.writeHead(200, headers);
      return res.end(JSON.stringify(channels));
    }

    // Banlı kullanıcılar: /api/guild/:guildId/bans
    const bansMatch = req.url?.match(/^\/api\/guild\/(\d+)\/bans$/);
    if (bansMatch) {
      const guild = dashboardData.client?.guilds.cache.get(bansMatch[1]);
      if (!guild) { res.writeHead(404, headers); return res.end(JSON.stringify({ error: 'Sunucu bulunamadı' })); }
      const bans = await guild.bans.fetch();
      const list = bans.map(b => ({ id: b.user.id, username: b.user.username, reason: b.reason })).slice(0, 100);
      res.writeHead(200, headers);
      return res.end(JSON.stringify(list));
    }

    // Ayarları getir: GET /api/guild/:guildId/settings
    const settingsMatch = req.url?.match(/^\/api\/guild\/(\d+)\/settings$/);
    if (settingsMatch && req.method === 'GET') {
      const gid = settingsMatch[1];
      const settings = {
        anticaps:  modConfigs.anticapsConfig?.get(gid)  ?? { enabled: false, threshold: 70, minLength: 8 },
        antilink:  (() => { const c = modConfigs.antilinkConfig?.get(gid); return c ? { enabled: c.enabled, whitelist: [...(c.whitelist ?? [])] } : { enabled: false, whitelist: [] }; })(),
        antiraid:  modConfigs.antiraidConfig?.get(gid)  ?? { enabled: false },
        automod:   modConfigs.automodConfig?.get(gid)   ?? { enabled: false },
        profanity: (() => { const c = modConfigs.profanityConfig?.get(gid); return { enabled: c?.enabled ?? false, wordCount: c?.words?.size ?? 0 }; })(),
        spam:      modConfigs.spamEnabled.get(gid)      ?? false,
      };
      res.writeHead(200, headers);
      return res.end(JSON.stringify(settings));
    }

    // Ayar güncelle: POST /api/guild/:guildId/settings
    if (settingsMatch && req.method === 'POST') {
      const gid = settingsMatch[1];
      const body = await readBody(req);
      const { key, value } = JSON.parse(body);

      if (key === 'anticaps' && modConfigs.anticapsConfig) {
        const cur = modConfigs.anticapsConfig.get(gid) ?? { enabled: false, threshold: 70, minLength: 8 };
        modConfigs.anticapsConfig.set(gid, { ...cur, enabled: value });
        pushLog({ guild: gid, action: `Anticaps ${value ? 'açıldı' : 'kapatıldı'}`, type: 'settings' });
      } else if (key === 'antilink' && modConfigs.antilinkConfig) {
        const cur = modConfigs.antilinkConfig.get(gid) ?? { enabled: false, whitelist: new Set() };
        modConfigs.antilinkConfig.set(gid, { ...cur, enabled: value });
        pushLog({ guild: gid, action: `Antilink ${value ? 'açıldı' : 'kapatıldı'}`, type: 'settings' });
      } else if (key === 'antiraid' && modConfigs.antiraidConfig) {
        const cur = modConfigs.antiraidConfig.get(gid) ?? { enabled: false, joinThreshold: 10, joinWindow: 10000, action: 'kick' };
        modConfigs.antiraidConfig.set(gid, { ...cur, enabled: value });
        pushLog({ guild: gid, action: `Antiraid ${value ? 'açıldı' : 'kapatıldı'}`, type: 'settings' });
      } else if (key === 'automod' && modConfigs.automodConfig) {
        const cur = modConfigs.automodConfig.get(gid) ?? { enabled: false, mentionLimit: 5, inviteBlock: true, duplicateMsg: true };
        modConfigs.automodConfig.set(gid, { ...cur, enabled: value });
        pushLog({ guild: gid, action: `Automod ${value ? 'açıldı' : 'kapatıldı'}`, type: 'settings' });
      } else if (key === 'profanity' && modConfigs.profanityConfig) {
        const cur = modConfigs.profanityConfig.get(gid) ?? { enabled: false, words: new Set(['bok','sik','orospu','piç','göt','am','amk','aq','oç','ibne']) };
        modConfigs.profanityConfig.set(gid, { ...cur, enabled: value });
        pushLog({ guild: gid, action: `Küfür filtresi ${value ? 'açıldı' : 'kapatıldı'}`, type: 'settings' });
      } else if (key === 'spam') {
        modConfigs.spamEnabled.set(gid, value);
        pushLog({ guild: gid, action: `Spam filtresi ${value ? 'açıldı' : 'kapatıldı'}`, type: 'settings' });
      }

      res.writeHead(200, headers);
      return res.end(JSON.stringify({ ok: true }));
    }

    // Loglar: GET /api/logs
    if (req.url === '/api/logs') {
      res.writeHead(200, headers);
      return res.end(JSON.stringify(logBuffer.slice(-100).reverse()));
    }

    // Moderasyon API
    if (req.url?.startsWith('/api/mod/') && req.method === 'POST') {
      const action = req.url.split('/api/mod/')[1];
      const body = await readBody(req);
      const payload = JSON.parse(body);
      const result = await handleModAction(action, payload);
      res.writeHead(result.ok ? 200 : 400, headers);
      return res.end(JSON.stringify(result));
    }

    // HTML dashboard
    const html = readFileSync(join(__dirname, 'index.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }

  server.on('upgrade', (req, socket) => {
    if (req.headers.upgrade?.toLowerCase() === 'websocket') {
      wsHandshake(req, socket);
    }
  });

  server.listen(PORT, () => {
    console.log(`\x1b[36m[Dashboard]\x1b[0m http://localhost:${PORT}`);
  });

  setInterval(broadcastStats, 5000);
}
